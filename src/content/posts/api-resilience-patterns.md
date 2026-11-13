---
title: API 請求卡住怎麼辦？聊聊 Timeout、Retry 與 Circuit Breaker
description: API 遲遲沒有回應時，如何限制等待、判斷能否重試，以及暫停對故障服務的呼叫？整理 Timeout、Backoff 與 Circuit Breaker 的用途和實作限制。
date: 2026-02-03
updated: 2026-11-13
category: tech-deep-dive
---

最近在研究 API 請求遲遲沒有回應時該怎麼處理。畫面一直 Loading，使用者不知道還要等多久；在 Production 環境裡，等待中的請求也可能持續佔用資源，影響其他功能。

我整理了 Timeout、Retry with Backoff 和 Circuit Breaker 的做法，分別處理等待太久、暫時失敗和服務持續故障的情況。

## 問題在哪？

想像一個情境：你的後端服務呼叫了一個第三方 API（比如金流、物流、或是某個資料服務），結果對方的伺服器卡住了，既不回傳成功，也不回傳失敗，就這樣 Hanging 在那邊。

如果你沒有任何防護措施，會發生什麼事？

1. **使用者一直等**：畫面一直轉圈，使用者不知道發生什麼事
2. **資源被佔用**：等待中的請求可能佔用連線、記憶體或其他資源，具體影響取決於架構；非同步等待不一定會卡住一條執行緒
3. **連鎖反應**：一個服務卡住，可能拖垮整個系統

前端呼叫 API 時，同樣需要 Timeout 和有限次數的重試。斷路器則多半放在伺服器端，用來保護連線這類共用資源，避免一個服務的故障拖累其他服務。扣款這類要用到商家私密金鑰的請求，也一定要由後端送出。

處理這些情況時，可以從等待上限、重試條件，以及持續故障時要不要停止呼叫來安排「韌性」（Resilience）機制。

## 第一道防線：Timeout（超時設定）

先限制單次請求的等待時間，避免它一直卡著。

Timeout 的概念很簡單：設定一個時間限制，如果在這個時間內沒有收到回應，就主動放棄這次請求。

```javascript
// 使用 fetch 搭配 AbortController 實現 Timeout
async function fetchWithTimeout(url, options = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new Error(`Request timeout after ${timeoutMs}ms`);
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}
```

這個範例只限制等待回應標頭的時間：取得 Response 後就清掉計時器，後續讀取回應內容仍可能等很久。它也會覆蓋呼叫端傳入的取消訊號；正式整合時，需要合併取消來源，並依需求把內容讀取算進時間上限。

### Timeout 該設多久？

這沒有標準答案，取決於呼叫的 API 性質：

- **一般 CRUD 操作**：3-5 秒
- **複雜查詢或報表**：10-30 秒
- **檔案上傳**：視檔案大小而定，可能需要更長

這些時間只是起始參考，還要看服務的正常延遲、使用者願意等多久，以及整個操作的時間上限。也要分清楚「呼叫端停止等待」和「伺服器取消處理」：前者不代表後者一定發生。

## 第二道防線：Retry with Backoff（重試機制）

請求失敗有時只是網路抖動，或對方伺服器剛好在重啟，稍後再試就可能成功。

但重試不能亂試，要有策略：

### Exponential Backoff（指數退避）

每次重試之間的等待時間要越來越長。為什麼？因為如果對方伺服器真的有問題，你瘋狂重試只會讓它更慘（雪上加霜）。

```javascript
async function fetchWithRetry(url, options = {}, maxAttempts = 3) {
  if (!Number.isInteger(maxAttempts) || maxAttempts < 1) {
    throw new RangeError("maxAttempts must be a positive integer");
  }

  let lastError;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, 5000);

      // 5xx 錯誤也要重試
      if (response.status >= 500) {
        throw new Error(`Server error: ${response.status}`);
      }

      return response;
    } catch (error) {
      lastError = error;
      console.warn(`Attempt ${attempt + 1} failed:`, error.message);

      // 最後一次就不用等了
      if (attempt < maxAttempts - 1) {
        // Exponential Backoff: 1秒, 2秒, 4秒...
        const delay = Math.pow(2, attempt) * 1000;
        // 加一點隨機性，避免多個請求同時重試（Thundering Herd）
        const jitter = Math.random() * 1000;
        await sleep(delay + jitter);
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError.message}`);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
```

`maxAttempts` 是總嘗試次數，包含第一次請求。預設值 3 代表最多送出 3 次，中間最多等待 2 次；如果想要「失敗後再試 3 次」，總次數就要設為 4。

### 什麼情況該重試？

- 網路錯誤（Network Error）、5xx 錯誤（Server Error）和 Timeout 可以考慮重試。
- 多數 4xx 錯誤（Client Error）需要先處理請求本身的問題，直接重試通常沒有用。429 限流則可能需要依伺服器告知的時間稍後再試。
- 401 表示缺少有效的認證，可能是 Token 過期，也可能是憑證無效。若系統有換發機制，可以先嘗試刷新 Token 再重試一次；否則應回到登入流程，避免一直重送同一份憑證。
- 403 代表伺服器拒絕存取，可能和權限或其他存取限制有關。單純重送請求通常沒用，需要先釐清拒絕原因。

上面的程式碼把 5xx 都列入重試，是簡化示範。正式使用時要區分錯誤類型，確認操作能否安全重送，也要把等待間隔算進整體時間上限。

## 第三道防線：Circuit Breaker（斷路器）

Circuit Breaker 的名稱來自電路中的斷路器（無熔絲開關）。電流異常時，斷路器會跳脫、切斷電路，排除問題後可以復歸再用，不像保險絲燒斷就得更換。軟體的斷路器借用這個概念，服務持續失敗時先暫停呼叫，保護系統資源；不同的是，它會自動試探服務是否恢復，再決定要不要回到正常狀態。

### 為什麼需要 Circuit Breaker？

以前面的範例來說，最多嘗試 3 次，也就是初次請求加上 2 次重試。若每次都等滿 5 秒，再加上退避和隨機等待，總共可能接近 18–20 秒。當許多請求同時在等，系統的連線和其他資源也可能逐漸吃緊。

Circuit Breaker 的邏輯是：**如果某個服務連續失敗太多次，就暫時不要再呼叫它，直接回傳錯誤**。過一段時間後再「試探性」地呼叫看看，如果成功了就恢復正常。

### 三種狀態

1. **Closed（關閉）**：正常運作，所有請求都會送出
2. **Open（開啟）**：斷路器跳開，所有請求直接失敗，不會真的送出
3. **Half-Open（半開）**：試探階段，允許少量請求通過測試服務是否恢復

下面的斷路器只用來理解狀態轉換，不能直接作為正式環境的併發實作。較早送出的請求若在跳開後才成功，仍會把狀態重設為 Closed；其他請求的 `finally` 也可能清掉半開試探的標記。正式使用時，需要辨識請求屬於哪一輪狀態，並讓試探請求管理自己的標記，或使用文末的現成套件。

```javascript
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5; // 連續失敗幾次就跳開
    this.resetTimeout = options.resetTimeout || 30000; // 多久後嘗試恢復（毫秒）

    this.state = "CLOSED";
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.halfOpenInFlight = false; // Half-Open 狀態下是否已有試探請求在進行
  }

  async call(fn) {
    // 如果斷路器開啟，檢查是否該進入半開狀態
    if (this.state === "OPEN") {
      if (Date.now() - this.lastFailureTime >= this.resetTimeout) {
        this.state = "HALF_OPEN";
      } else {
        throw new Error("Circuit breaker is OPEN - request blocked");
      }
    }

    // Half-Open 時只放行一個試探請求，避免服務剛恢復就被一次湧入的請求打垮
    if (this.state === "HALF_OPEN") {
      if (this.halfOpenInFlight) {
        throw new Error("Circuit breaker is HALF_OPEN - probing in progress");
      }
      this.halfOpenInFlight = true;
    }

    try {
      const result = await fn();

      // 請求成功，重置狀態
      this.onSuccess();
      return result;
    } catch (error) {
      // 請求失敗，更新失敗計數
      this.onFailure();
      throw error;
    } finally {
      this.halfOpenInFlight = false;
    }
  }

  onSuccess() {
    this.failureCount = 0;
    this.state = "CLOSED";
  }

  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.failureThreshold) {
      this.state = "OPEN";
      console.warn("Circuit breaker opened!");
    }
  }
}

// 使用範例
const paymentBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 30000,
});

// idempotencyKey 由呼叫端在建立付款嘗試時產生並保存，例如 crypto.randomUUID()
async function processPayment(data, idempotencyKey) {
  return paymentBreaker.call(() =>
    fetchWithRetry("https://api.payment.com/charge", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // 這次付款嘗試的每次重送，都帶同一把 key
        "Idempotency-Key": idempotencyKey,
      },
      body: JSON.stringify(data),
    }),
  );
}
```

像扣款這種非冪等（non-idempotent）操作，重試前務必確認 API 支援 Idempotency Key，否則 Timeout 後重試可能造成重複扣款。上面範例的 key 代表一次付款嘗試，這次嘗試的每次重送都帶同一把 key。這把 key 還在伺服器的保存期限內時，伺服器就能認出是同一個請求，回傳先前的結果，不會重複扣款。不過原請求還在處理時就重送，可能會收到衝突錯誤（例如 409），要稍後再查詢結果或重試。

如果直接拿 `orderId` 當 key，使用者第一次刷卡被拒、換卡重付同一筆訂單時，會撞到同一把 key，可能拿到上次的拒絕結果，或因為內容不同而被拒絕。所以換卡或重新付款時，要建立新的付款嘗試，並產生新的 key。

## 實務上的整合

整合時，先限制每次請求的等待時間，失敗後依條件重試；服務持續故障時，斷路器會暫停新的呼叫。照前面 `processPayment` 的寫法，斷路器包在最外層，請求送出前會先檢查它的狀態：

```mermaid
flowchart LR
    A["發出請求"] --> D{"Circuit Breaker<br/>檢查狀態"}
    D -->|"Open 且未到恢復時間<br/>或 Half-Open 已有試探在進行"| F["快速失敗<br/>不送出請求"]
    D -->|"Closed<br/>或 Half-Open 試探"| B["送出請求<br/>Timeout 限制等待"]
    B -->|"超時、網路錯誤或 5xx"| C["Retry with Backoff<br/>等待後再試"]
    C -->|"還有次數"| B
    C -->|"次數用盡"| G["回傳錯誤<br/>斷路器記一次失敗<br/>達門檻就跳開"]
    B -->|"收到回應（非 5xx）"| E["回傳結果<br/>斷路器回到 Closed"]
```

如果你用的是 Node.js，可以考慮使用現成的套件：

- **[cockatiel](https://www.npmjs.com/package/cockatiel)**：功能完整的 resilience 套件
- **[axios-retry](https://www.npmjs.com/package/axios-retry)**：如果你用 Axios，這個插件很方便
- **[opossum](https://www.npmjs.com/package/opossum)**：專門的 Circuit Breaker 實作

---

站內相關文章：

- [前端測試實戰 — Vitest 入門](/posts/frontend-testing-vitest-guide/)
- [Nuxt 3 JWT 身份驗證實作筆記](/posts/nuxt3-jwt-pinia-auth/)
