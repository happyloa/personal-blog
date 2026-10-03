---
title: 連續搜尋時，怎麼避免舊結果蓋掉新結果？
description: 從搜尋框的回應順序，聊聊 JavaScript 的 await、Promise 與 Event Loop，並用請求編號和 AbortController 處理過期結果、錯誤訊息與載入狀態。
date: 2026-02-20
category: tech-deep-dive
---

搜尋框看起來很單純：輸入文字、查 API、把結果放到畫面。

假設先輸入「滑鼠」，接著改成「無線滑鼠」。第二次搜尋比較快，畫面先顯示無線滑鼠；過了一下，第一次搜尋才回來，結果又變回滑鼠。輸入框明明已經改了，列表卻還在顯示上一個關鍵字。

每次請求都成功，也可能出這個問題。最近整理 JavaScript 非同步時，我覺得拿搜尋框來想，比只看幾行 `console.log` 容易理解。

## await 會等，但每次搜尋還是各跑各的

先看一個直覺的寫法。`state.items` 代表畫面要顯示的商品：

```javascript
async function searchProducts(keyword) {
  const response = await fetch(`/products?q=${encodeURIComponent(keyword)}`);
  const data = await response.json();
  state.items = data.items;
}
```

`await` 讓這一次 `searchProducts()` 等資料回來，再往下設定結果；等待期間，使用者還能輸入文字，觸發另一次搜尋。兩次呼叫各自等待自己的請求，後送出的不一定比較晚完成。詳見 [MDN 對 await 的說明](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/await)。

| 順序 | 發生的事                       |
| ---- | ------------------------------ |
| 1    | 送出 A：搜尋「滑鼠」           |
| 2    | 送出 B：搜尋「無線滑鼠」       |
| 3    | B 先回來，顯示「無線滑鼠」結果 |
| 4    | A 晚回來，把結果改成「滑鼠」   |

這種結果受完成順序影響的問題，可以稱為 race condition。這裡要決定的規則很明確：畫面只接受最新一次搜尋的結果。前面那段還省略了 HTTP 錯誤處理，後面會一起補上。

## JavaScript 一次跑一段，怎麼還會撞到？

在同一個 JavaScript 執行環境裡，一段正在執行的工作會先跑完，才輪到另一段。這個特性叫 run-to-completion，見 [MDN 的執行模型](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Execution_model#run-to-completion)。

但遇到 `await`，非同步函式可以先停在那裡，之後再接著跑。搜尋 A 送出後等待，搜尋 B 就有機會開始；等回應到達，再分別執行更新畫面的程式。

所以這個例子裡，兩段設定結果的程式各自執行，仍然可能以 B、A 的順序修改同一份畫面資料。要處理的是「哪個結果還有效」。

<details>
<summary>補充：Promise、setTimeout 和 Event Loop 怎麼排？</summary>

在瀏覽器 console 執行這段：

```javascript
console.log("start");

setTimeout(() => console.log("timer"), 0);

Promise.resolve().then(() => console.log("promise"));

console.log("end");
```

這個例子的輸出順序是 `start`、`end`、`promise`、`timer`。

目前這段程式先跑完。Promise 的 `.then()` 回呼排進 microtask（微任務）；計時器的回呼則是另一個 task（任務）。在這個例子裡，瀏覽器先清完微任務，才輪到計時器。Event Loop 負責安排這些工作何時執行，詳見 [MDN 的微任務說明](https://developer.mozilla.org/en-US/docs/Web/API/HTML_DOM_API/Microtask_guide)。

`setTimeout(..., 0)` 也得等目前的工作結束，不能插進正在執行的程式。這段例子的順序固定，兩個網路請求何時完成，則會受到伺服器和網路狀況影響。

如果一直建立新的微任務，或跑很久的同步迴圈，瀏覽器也會延後處理其他工作。把函式加上 `async`，裡面的大量計算仍然可能卡住畫面。

</details>

## 給每次搜尋一個編號

每次開始搜尋就把編號加一。送出時記住自己的編號，回來後檢查：如果已經有更新的搜尋，就放棄這次結果。

錯誤訊息和 Loading 也得照這個規則。否則 A 雖然不再覆蓋商品，還可能在失敗時蓋掉 B 的提示，或提前關掉 B 的載入動畫。

另外，用 `AbortController` 取消上一個 `fetch`，能停止不再需要的請求或回應讀取，見 [MDN 的取消請求範例](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#canceling_a_request)。我會把編號檢查也留下，決定哪些結果能更新畫面。

<details>
<summary>完整範例：只讓最新搜尋更新資料</summary>

範例用一般 JavaScript 寫，沒有搭配框架。`state` 記錄結果、載入狀態和錯誤；接到 Vue 或 React 畫面時，再換成框架的狀態更新方式。這裡假設 API 回傳 `{ "items": [...] }`。

```javascript
const state = { items: [], loading: false, error: "" };
let latestRequestId = 0;
let controller;

async function searchProducts(keyword) {
  const requestId = ++latestRequestId;
  controller?.abort();

  const currentController = new AbortController();
  controller = currentController;
  const query = keyword.trim();

  state.items = [];
  state.error = "";

  if (!query) {
    state.loading = false;
    return;
  }

  state.loading = true;

  try {
    const response = await fetch(`/products?q=${encodeURIComponent(query)}`, {
      signal: currentController.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    if (requestId !== latestRequestId) return;

    state.items = data.items;
  } catch (error) {
    if (requestId === latestRequestId && error.name !== "AbortError") {
      state.error = "搜尋失敗，請稍後再試";
    }
  } finally {
    if (requestId === latestRequestId) {
      state.loading = false;
    }
  }
}
```

取消請求時，用這裡的預設 `abort()` 會收到 `AbortError`，所以不顯示搜尋失敗。HTTP `404` 或 `500` 則不會讓 `fetch` 自動丟出錯誤，要自己檢查 `response.ok`，見 [MDN 的回應狀態說明](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API/Using_Fetch#checking_response_status)。正式串接時也要檢查回傳資料的格式。

清空關鍵字時，編號仍然往前推、取消上一個請求，再清掉結果。這樣清空後，舊回應也不能把商品塞回畫面。

</details>

## 少送幾次請求，還是要檢查舊結果

Debounce 是等使用者停下輸入一小段時間，再送搜尋請求。例如停了 300 毫秒才查，可以少送一些請求；300 毫秒只是範例，還得依使用感受調整。

不過，之前已經送出去的搜尋，仍可能晚回來。加 debounce 時，我會在輸入改變的當下先讓舊搜尋失效、取消舊請求，再安排下一次搜尋。若等到下一次請求送出才改編號，等待的那段空檔，舊結果仍可能出現。

離開搜尋頁面時，也要取消計時器、讓舊搜尋失效，並清理還沒完成的請求。React 官方的 [Effect 資料請求範例](https://react.dev/reference/react/useEffect#fetching-data-with-effects)就透過 cleanup 裡的旗標，忽略已經過期的結果。用 Vue 或原生 JavaScript，也要按各自的生命週期處理。

取消搜尋適合這種讀取資料的情境。建立訂單或扣款已經送到伺服器時，取消前端等待，不代表伺服器也撤回了操作；這時需要查詢結果，以及避免重複執行的設計。

## 測試時，故意讓舊請求晚回來

一直用正常網速操作，兩次請求可能剛好照順序完成，問題就藏起來了。我會控制兩次回應的完成時間，確認這幾種情況：

- B 先成功、A 後成功，最後仍顯示 B。
- A 先結束、B 還在等，Loading 仍然開著。
- B 成功後，A 才失敗，畫面不出現 A 的錯誤。
- 清空輸入或離開頁面後，舊回應不能再更新結果。

也要測最新搜尋真的失敗，以及查不到商品的情況。錯誤要顯示提示，空陣列則顯示「沒有符合的商品」，兩種畫面不同。

先把這些順序測過，再接上搜尋框和 debounce，比較容易看出是請求順序、取消時機，還是畫面更新出了問題。

## 站內相關文章

- [API 請求卡住怎麼辦？Timeout、Retry 與 Circuit Breaker](/posts/api-resilience-patterns/)
- [前端測試實戰：以 Vitest 為例](/posts/frontend-testing-vitest-guide/)
- [瀏覽器是怎麼顯示網頁的？](/posts/how-browser-renders-webpage/)
