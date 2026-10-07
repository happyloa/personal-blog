---
title: 從商品列表到建立訂單，API 要怎麼設計？
description: 用一個小型購物網站，整理 API 的網址、資料格式、分頁、權限與錯誤回應，也想想價格變動、重複下單和修改規格時該怎麼處理。
date: 2026-09-22
category: tech-deep-dive
---

寫購物網站的畫面時，商品卡片需要名稱和價格，結帳頁需要送出購買數量，會員中心還要查訂單。把這些需求列出來，好像就知道要開哪些 API 了。

但再往下想，就會多出一些問題：價格由誰決定？網址換成別人的訂單編號，還查得到嗎？按下結帳後沒收到回應，可以再按一次嗎？

先前那篇 [HTTP 方法與狀態碼](/posts/http-methods-status-codes/)整理了基本用法。這次拿商品列表和下單來想，看看前後端串接之前，還有哪些事情要先說好。

## 先列出畫面需要做什麼

假設網站先做四件事：

<div class="table-wrapper" tabindex="0" role="group" aria-label="使用者操作與 API 對照（可水平捲動）">

| 使用者要做的事         | API                 |
| ---------------------- | ------------------- |
| 看商品列表、篩選分類   | `GET /products`     |
| 看一個商品的詳細資料   | `GET /products/101` |
| 送出購買內容，建立訂單 | `POST /orders`      |
| 查看自己的一筆訂單     | `GET /orders/9001`  |

</div>

這裡把商品和訂單當成「資源」，也就是 API 操作的對象。網址指出對象，HTTP 方法說明動作。[Microsoft 的 API 設計指南](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design#organize-the-api-design-around-resources)也從這個方向談起。

我會先把這幾個請求的範例寫好，和串接的人一起確認。像是訂單成立算不算付款成功、缺貨時整張單都拒絕還是保留能買的商品，得先有答案，後面才知道程式該做什麼。

## 商品列表，要給畫面哪些資料？

商品卡片只需要名稱和價格，就先回這些。商品成本、供應商備註或後台欄位，沒有必要跟著送到瀏覽器。即使畫面沒顯示，使用者仍能看見 API 回應；[OWASP 對欄位權限的說明](https://owasp.org/API-Security/editions/2023/en/0xa3-broken-object-property-level-authorization/)也提醒，要明確選出允許讀取和修改的欄位。

例如找分類 3 的商品，每次最多拿 20 筆：

```http
GET /products?category_id=3&limit=20
```

回應可以長這樣，範例只列一筆商品：

```json
{
  "items": [
    {
      "id": 101,
      "name": "無線滑鼠",
      "price": 1290,
      "currency": "TWD"
    }
  ],
  "next_cursor": "next-page-token"
}
```

這裡的金額約定用新台幣整數元。單位要寫進文件，不能讓前端猜 `1290` 是 1,290 元還是 12.9 元。

`next_cursor` 是後端產生的下一頁識別值，上面的文字只是示意。前端下次把它放進 `cursor` 參數；沒有下一頁就回 `null`。查不到商品則回 `items: []`，讓畫面顯示「沒有符合的商品」，不用把正常的空結果當錯誤。

<details>
<summary>補充：分頁和排序要一起訂</summary>

可以用頁碼分頁，也可以用 cursor（游標）記錄接著從哪裡查。像商品後台要直接跳第十頁，頁碼比較直覺；一直往下捲的列表，則可以考慮游標。

假設這個列表按商品 ID 由小到大排，游標就能記錄上一批最後的位置。若改用建立時間，而多筆商品時間相同，還得加 ID 決定先後。[PostgreSQL 的分頁說明](https://www.postgresql.org/docs/current/queries-limit.html)也提醒要有明確的排序。翻頁期間資料可能新增、刪除或改分類，這種列表也不保證每頁都來自同一個時間點。

`limit` 要有預設值和上限，分類、排序參數也要檢查。這個範例可以約定預設 20 筆、最多 100 筆，超過上限就回錯誤；這些是自己訂的規格。Microsoft 有[分頁與篩選的例子](https://learn.microsoft.com/en-us/azure/architecture/best-practices/api-design#implement-data-pagination-and-filtering)。

</details>

## 建立訂單，價格交給後端確認

結帳時，前端送商品、數量，以及使用者看到的單價：

```http
POST /orders
Content-Type: application/json
```

```json
{
  "items": [{ "product_id": 101, "quantity": 2, "expected_unit_price": 1290 }]
}
```

使用者是誰，由後端根據登入資訊確認。商品是否能買、數量是否為正整數、每筆數量與整張單的上限，都得檢查。這個範例的每個品項必須有上面三個欄位；多傳訂單狀態、指定成交價或別人的會員 ID，就拒絕。

`expected_unit_price` 讓後端知道使用者看到多少錢，金額單位和商品列表相同。後端仍要查自己的商品單價，和這個值核對；不同就先拒絕下單，請使用者重新確認。有折扣或運費時，還需要核對完整的結帳金額，這個例子先用單純的商品單價來算。

確認可購買後，把成交價留在訂單明細。商品之後改價，舊訂單仍要能查到當時買多少錢。

成功建立待付款訂單，可以回 `201 Created`，並用 `Location` 告訴前端新訂單在哪裡，見 [HTTP 對 201 的定義](https://www.rfc-editor.org/rfc/rfc9110.html#name-201-created)：

```http
HTTP/1.1 201 Created
Location: /orders/9001
Content-Type: application/json
```

```json
{
  "id": 9001,
  "status": "pending_payment",
  "total": 2580,
  "currency": "TWD"
}
```

`pending_payment` 表示訂單已成立、還沒付款。前端收到這個結果，可以進入付款步驟；付款成功得另外確認。

<details>
<summary>補充：庫存和重複下單，也要有規則</summary>

扣庫存和存訂單要放在同一筆資料庫交易裡，讓它們一起成功或一起撤回；同時搶庫存時，也要用資料庫能處理衝突的寫法。待付款訂單保留多久、逾期怎麼把庫存放回去，則是另外的規則。

如果前端沒收到回應，後端可能其實已經建立訂單。重送時可以帶同一個 idempotency key，讓後端認出「這是同一次下單」。按鈕暫時不能按能減少誤觸，但伺服器仍得處理重複請求。

這需要後端配合保存識別碼與結果，讓同一位使用者的同一個碼只對應一次下單，並處理兩個相同請求同時抵達的情況。同一個碼卻帶不同內容，也要拒絕；保存多久、失敗能否重試，都得訂好。可以參考 [Stripe 的做法](https://docs.stripe.com/api/idempotent_requests)。自己的 API 也需要實作這些規則，光加一個 header 不會自動生效。

</details>

## 查訂單，登入之後還要查權限

`GET /orders/9001` 不能只確認「有登入」。還要確認登入者能不能看訂單 9001；讀取、修改、取消都要各自檢查。

假設網址改成 9002 就能看到別人的地址和購買內容，這就是漏了資料的存取權限。把編號換成難猜的字串，也仍然需要權限檢查。[OWASP 的資料存取權限案例](https://owasp.org/API-Security/editions/2023/en/0xa1-broken-object-level-authorization/)說明了這類問題。

一般會員看不到別人的訂單時，可以統一回 `404`，避免透露那筆訂單是否存在；管理者查詢則按另外的權限規則處理。這種隱藏資源的回應方式，也在 [HTTP 的 403 說明](https://www.rfc-editor.org/rfc/rfc9110.html#name-403-forbidden)裡有提到。

## 出錯時，前端要知道接下來怎麼做

數量填錯、商品售完和伺服器故障，畫面的處理方式不同。我會把常見錯誤一起寫進文件：

<div class="table-wrapper" tabindex="0" role="group" aria-label="錯誤狀況與回應方式（可水平捲動）">

| 情況                 | 這個範例的狀態碼 | 畫面可以怎麼處理     |
| -------------------- | ---------------- | -------------------- |
| JSON 格式壞掉        | `400`            | 檢查送出的資料       |
| 數量不是正整數       | `422`            | 在數量欄位提示       |
| 商品庫存不足         | `409`            | 請使用者調整購買內容 |
| 訂單不存在或不能查看 | `404`            | 顯示找不到訂單       |
| 伺服器發生非預期錯誤 | `500`            | 告知暫時無法完成     |

</div>

這是範例的選擇；狀態碼的意思可以查 [HTTP 規格](https://www.rfc-editor.org/rfc/rfc9110.html#name-client-error-4xx)。像 `409` 表示和資源目前的狀態衝突，`422` 則適合格式能讀、內容卻無法處理的情況。

回應裡再帶固定的錯誤代碼和欄位位置：

```json
{
  "error": {
    "code": "INVALID_QUANTITY",
    "message": "購買數量必須是正整數",
    "field": "items[0].quantity"
  }
}
```

前端用 `code` 決定處理方式，`message` 負責給人看。這樣改提示文字，不會把程式判斷一起改壞。程式堆疊和資料庫錯誤留在伺服器紀錄，回應可以附一個查詢用的錯誤編號。

## 改規格前，拿舊用法再跑一次

如果把 `price` 從數字改成文字，原本做金額計算的前端可能就壞了。新增欄位通常比較容易相容，也得確認串接方是否拒絕未知欄位；新增訂單狀態，也可能讓原本只認得幾個狀態的畫面出問題。Google 的 [API 相容性指南](https://google.aip.dev/180)有整理欄位、型別和行為變動時要留意的事。

我會留一組舊請求與預期回應，改完再確認商品列表、建立訂單和查詢權限仍然符合原本約定。特別是換成另一個會員查訂單、送出 0 或小數數量、同時重送相同下單內容，這些要真的測。

文件也要跟著改，尤其是必填欄位、金額單位、空結果和錯誤回應。需要不相容的修改時，再討論新版 API 與舊版保留多久。

拿這幾個請求做一個小前端試接，也能找出文件漏掉的地方。像是價格變了要顯示什麼、等不到回應時怎麼找回訂單，真的走一次流程，比較容易發現缺了哪一步。

## 站內相關文章

- [HTTP 方法與狀態碼：讓 API 說人話](/posts/http-methods-status-codes/)
- [用 Vue 的觀念理解 Laravel：前端工程師的後端入門筆記](/posts/laravel-php-first-backend/)
- [API 請求卡住怎麼辦？Timeout、Retry 與 Circuit Breaker](/posts/api-resilience-patterns/)
- [資料庫規劃筆記：從搶票、多對多關係到回歸測試](/posts/database-planning-interview-notes/)
