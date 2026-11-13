---
title: Cookie、Session、Token：登入狀態到底存在哪裡？
description: HTTP 不會記得你是誰，登入狀態得靠 Cookie、Session 或 Token 帶著走。整理三者的關係、Token 該放哪裡，以及 HttpOnly、SameSite 和 XSS、CSRF 的關聯。
date: 2026-11-14
category: web-basics
---

登入一個網站之後，換頁、重新整理，網站都還認得你。但 HTTP 本身不會記得上一個請求是誰送的，[RFC 9110](https://www.rfc-editor.org/rfc/rfc9110.html#section-3.3) 把它定義成無狀態（stateless）的協定：每個請求都能單獨理解，伺服器不必記住前後文。

那「已登入」這件事是存在哪裡？之前寫 [Nuxt 3 的 JWT 登入](/posts/nuxt3-jwt-pinia-auth/)時，我只處理了前端怎麼存、怎麼帶 token。這次想把 Cookie、Session、Token 三個常被放在一起比較的詞分開來看，它們其實在回答不同的問題。

## 先分清楚：三個詞在講不同的事

「要用 Cookie 還是 Token？」是很常見的問法，但它把兩件事混在一起了：

- 身分資料存在哪一邊：存在伺服器，客戶端只拿一個編號，這是 Session；把資料簽名後交給客戶端保管，這是自帶內容的 Token，最常見的格式是 JWT。
- 客戶端把憑證放哪裡、怎麼送回來：放在 Cookie，由瀏覽器自動附上；或由程式自己保存，再放進 `Authorization` 標頭。

所以 Cookie 是存放和傳送的方式，Session 和 Token 是憑證的種類，兩邊可以交叉搭配：

<div class="table-wrapper" tabindex="0" role="group" aria-label="憑證種類與存放方式的搭配（可水平捲動）">

| 憑證種類 ＼ 放在哪裡          | Cookie                         | 程式自己保存，放進 `Authorization` 標頭     |
| ----------------------------- | ------------------------------ | ------------------------------------------- |
| Session ID（或 opaque token） | 傳統網站最常見的做法           | API 常見，例如 Laravel Sanctum 的 API token |
| 自帶內容的 Token（例如 JWT）  | 可以，常搭配 `HttpOnly` Cookie | 手機 App、第三方 API 常見                   |

</div>

「Token」這個詞還會用在另一種東西上：只是一串隨機字串、資料仍然存在伺服器的 opaque token。[Laravel Sanctum 的 API token](https://laravel.com/framework/docs/13.x/sanctum#how-it-works) 就是這種，token 存在資料表裡，請求時放在 `Authorization` 標頭。它運作起來比較接近 Session ID，所以表格裡和 Session ID 放在同一列。這篇後面說的 Token，指的都是 JWT 這種自帶內容的。

下面依序看 Cookie、Session、Token，再回來談怎麼搭配。

## Cookie：瀏覽器幫你保管、自動帶上的小資料

伺服器在回應裡放一個 `Set-Cookie` 標頭，瀏覽器就會把這筆資料存起來。之後送請求到符合條件的網址時，瀏覽器會自動在 `Cookie` 標頭帶上它：

```http
HTTP/1.1 200 OK
Set-Cookie: session_id=k3J9xQ2mZp; Path=/; HttpOnly; Secure; SameSite=Lax
```

```http
GET /orders HTTP/1.1
Host: shop.example
Cookie: session_id=k3J9xQ2mZp
```

Cookie 本身只是「一小段會被自動帶上的資料」。裡面放 Session ID、JWT 還是語言偏好，是網站自己決定的。它的屬性和傳送規則可以對照 [MDN 的 Set-Cookie 說明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie)。

「自動帶上」是它方便的地方，後面談 CSRF 時也會看到，這同時是它的弱點。

## Session：資料放伺服器，客戶端只拿編號

Session 的做法是：登入成功後，伺服器產生一個隨機的 Session ID，把「這個 ID 對應哪個使用者」記在伺服器這邊，可能是記憶體、Redis 或資料庫。客戶端只拿到 ID，通常放在 Cookie 裡。

之後每個請求帶著 ID 進來，伺服器查一次對照表，就知道是誰。

這樣做的好處是控制權都在伺服器：

- 登出或強制踢人，只要刪掉伺服器上那筆記錄，ID 立刻失效。
- 權限改了，只要伺服器每次都重新查使用者資料，下一個請求就會拿到新的。
- 客戶端拿到的只是一串沒有意義的編號，看不出任何內容。

要付出的是每個請求都得查一次，而且伺服器要保存狀態。伺服器變成多台時，Session 得放在大家都讀得到的地方，例如 Redis，不能只存在某一台的記憶體裡。[高併發那篇](/posts/high-concurrency-system-design/)談水平擴展時提過同一件事。

Session ID 必須猜不到。[OWASP 的 Session 管理指引](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html#session-id-entropy)建議至少要有 64 bits 的亂度，實務上交給框架產生，不要自己用時間或流水號拼。

## Token（JWT）：把資料簽名後交給客戶端

Token 的方向相反：伺服器不保存登入狀態，改成把「這個人是誰、什麼時候過期」寫進一段資料，簽名後整包交給客戶端。之後客戶端每次帶著它來，伺服器驗證簽章就能相信內容，不必查對照表。

最常見的格式是 JWT（[RFC 7519](https://www.rfc-editor.org/rfc/rfc7519.html)），長得像三段用句點接起來的字串：

```text
eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI0MiIsImV4cCI6MTc5NDYxMDgwMH0.（簽章）
```

三段分別是標頭、內容（payload）和簽章，前兩段只是 Base64URL 編碼。這裡有兩個容易誤會的地方：

- 簽章只保證內容沒被改過，不會把內容藏起來。任何拿到 token 的人都能解開 payload 來看，所以別把密碼或敏感資料放進去。
- 伺服器一定要驗證簽章和有效期限。只解開 payload 就相信它，等於誰都能自己寫一張通行證。

JWT 省掉了查表，多台伺服器或多個服務之間也不用共用 Session 儲存區，只要都拿得到驗證用的金鑰。

它的代價在撤銷：token 簽出去之後，在過期前都有效。伺服器如果只驗簽章、什麼都不記，就沒辦法讓某一張 token 提前失效。常見的處理方式有兩種，各有成本：

- 把 access token 的效期設短（例如幾分鐘到幾小時），另外發一個效期較長的 refresh token 來換新的。refresh token 客戶端也拿一份，但伺服器通常會留一筆紀錄，要撤銷時刪掉那筆就好。
- 在伺服器維護一份撤銷名單，每個請求都查一次。這樣又回到「伺服器要保存狀態」，只是查的資料比 Session 少。

所以「JWT 是無狀態的」只在不需要立即撤銷時成立。需要馬上登出、馬上收回權限的系統，多少還是得在伺服器記點東西。

## Token 要放在哪裡？

如果用 Token，瀏覽器端要找地方存。兩個常見的選擇，擋的是不同的攻擊：

<div class="table-wrapper" tabindex="0" role="group" aria-label="Token 存放位置比較（可水平捲動）">

| 放在哪裡                  | 頁面上的 JavaScript 讀得到嗎 | 瀏覽器會自動帶上嗎 | 主要要防什麼                     |
| ------------------------- | ---------------------------- | ------------------ | -------------------------------- |
| `localStorage`            | 讀得到                       | 不會，要程式自己帶 | XSS：惡意腳本可以直接把它讀走    |
| 設了 `HttpOnly` 的 Cookie | 讀不到                       | 會                 | CSRF：別的網站可以讓瀏覽器幫你送 |

</div>

[OWASP 的 HTML5 安全指引](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#local-storage)明確建議不要把 Session 識別碼放在 `localStorage`，因為 JavaScript 永遠讀得到；Cookie 可以用 `HttpOnly` 降低這個風險。

不過 `HttpOnly` 擋的只是「把憑證偷走」。網站如果被注入惡意腳本，那段腳本還是可以直接在使用者的頁面上送請求，瀏覽器一樣會帶上 Cookie。所以它是減輕損害的手段，XSS 本身還是得靠輸出時跳脫、CSP 這些方式防。

我之前那篇 Nuxt 範例把 token 放在沒有 `HttpOnly` 的 Cookie 裡，因為前端要讀出來放進 `Authorization` 標頭。那個做法對 XSS 的風險和 `localStorage` 差不多，文章裡也有註明。如果前後端在同一個網站底下，讓後端直接發 `HttpOnly` Cookie、前端完全不碰 token，會比較穩。

## Cookie 的三個屬性各擋什麼？

`Set-Cookie` 後面那幾個屬性，是 Cookie 放登入憑證時的基本配備：

- `HttpOnly`：頁面上的 JavaScript 讀不到這顆 Cookie（`document.cookie` 看不到它），只有瀏覽器送請求時會帶上。
- `Secure`：只在 HTTPS 連線時傳送，避免憑證在明文連線中被看到。
- `SameSite`：控制「從別的網站發起的請求」要不要帶這顆 Cookie。

`SameSite` 有三個值：

- `Strict`：只有同一個網站發起的請求才帶。從別的網站點連結過來的那一次請求也不帶，所以使用者可能看到「明明登入了卻像沒登入」的頁面。
- `Lax`：同站請求會帶；跨站請求只有在「最上層的頁面導覽」而且是 GET 這類安全方法時才帶，例如從別的網站點連結進來。別的網站用表單 POST 或 `fetch` 發的請求不會帶。
- `None`：跨站請求也帶，必須同時設定 `Secure`。會用到的情況有兩種：服務要被嵌在別的網站裡，或前端和 API 在不同網站、又要帶著 Cookie 呼叫。Firefox 和 Safari 預設還會另外限制第三方 Cookie，見 [MDN 的第三方 Cookie 說明](https://developer.mozilla.org/en-US/docs/Web/Privacy/Guides/Third-party_cookies)，所以設了 `None` 也不保證送得出去。

沒寫 `SameSite` 時，各家瀏覽器的預設行為不一樣，有的會當成 `Lax`，而且這種「預設的 Lax」規則比明確寫出來的寬鬆一點，細節見 [MDN 的說明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value)。放登入憑證的 Cookie，我會明確寫出來，不依賴預設值。

<details>
<summary>補充：Domain、__Host- 前綴與有效期限</summary>

`Domain` 決定哪些主機會收到這顆 Cookie。不寫的話，只有設定它的那台主機會收到；寫成 `Domain=example.com`，所有子網域也都會收到。子網域裡只要有一個不受你控制，它就收得到這顆 Cookie，所以登入用的 Cookie 通常不寫 `Domain`。

不過不寫 `Domain` 只擋得住被讀走。子網域還是可以自己設一顆 `Domain=example.com` 的同名 Cookie，瀏覽器會把它一起送到你的主機，伺服器分不出哪一顆是自己發的，[RFC 6265](https://www.rfc-editor.org/rfc/rfc6265.html#section-8.6) 把這個問題叫 Weak Integrity。這一點要靠 `__Host-` 前綴處理。

名稱以 `__Host-` 開頭的 Cookie，瀏覽器會強制檢查三件事：有 `Secure`、沒有 `Domain`、`Path=/`，不符合就拒收。這樣可以確保它只會送回設定它的那台主機，[MDN 的 Cookie 前綴說明](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#cookie_prefixes)有完整規則。

有效期限用 `Max-Age` 或 `Expires` 設定。兩個都沒寫的話，它是 session cookie，瀏覽器關閉時通常會清掉；不過有些瀏覽器的「恢復上次的分頁」功能會把它留著，不能把「關掉瀏覽器」當成登出機制。

</details>

## XSS 和 CSRF 差在哪裡？

這兩種攻擊常被一起提，但方向不一樣：

- XSS（跨站腳本攻擊）：攻擊者想辦法讓自己的 JavaScript 在你的網站上執行，例如留言內容沒有跳脫就顯示出來。腳本跑在你的網域裡，能讀 `localStorage`、能讀沒有 `HttpOnly` 的 Cookie，也能直接用使用者的身分送請求。
- CSRF（跨站請求偽造）：使用者登入了你的網站，又開了攻擊者的頁面。那個頁面偷偷送一個請求到你的網站，瀏覽器照規則自動帶上 Cookie，伺服器就以為是使用者本人的操作。攻擊者讀不到回應，但轉帳、改密碼這類請求已經送出去了。

所以憑證放 Cookie 時要處理 CSRF。常見的做法可以一起用：

- `SameSite=Lax` 或 `Strict`，讓跨站的 POST 不帶 Cookie。
- 會改資料的操作不要用 GET。`Lax` 在最上層導覽的 GET 仍會帶 Cookie，如果「刪除」是一個 GET 連結，就擋不住。
- 加上 CSRF token：伺服器發一個別的網站拿不到的隨機值，請求時要一併送回來驗證。
- 檢查請求的 `Origin` 標頭是不是自己的網站。

[OWASP 的 CSRF 防護指引](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)把 `SameSite` 列為多一層的防護，建議搭配 token 這類主要手段，不要只靠它。

token 由程式自己放進 `Authorization` 標頭時，別的網站沒辦法讓瀏覽器替它附上這個標頭，所以沒有 CSRF 的問題，風險轉到「程式讀得到 token」的 XSS 那一邊。例外是 HTTP Basic 這類由瀏覽器記住帳密的驗證，瀏覽器會自己帶上 `Authorization`，一樣要防 CSRF。

## 我會怎麼選？

這題沒有固定答案，我會先看系統的樣子：

- 伺服器直接產生頁面的網站，例如一般的 Laravel 專案：用框架內建的 Session 加 Cookie 就好，登出和權限變更都即時，CSRF 防護框架也有。
- 前後端分離、但前端和 API 在同一個網站底下：一樣可以用 `HttpOnly` Cookie。Laravel Sanctum 的 SPA 驗證就是這樣做的，[官方文件](https://laravel.com/framework/docs/13.x/sanctum#spa-authentication)說這個模式不使用任何 token，而是沿用 Laravel 內建的 Cookie Session，所以前端一樣要照文件處理 CSRF token。
- 手機 App 或給第三方呼叫的 API：沒有瀏覽器幫忙管 Cookie，通常發 token，放在 `Authorization` 標頭。
- 多個服務要共用登入狀態：短效的 JWT 可以讓各服務自己驗證，不必都去查同一個 Session 儲存區，再另外安排換發和撤銷。

選之前我會先問幾件事：需不需要立刻登出或收回權限？客戶端是不是只有瀏覽器？前端和 API 是不是同一個網站？答案不同，合適的搭配也不同。

## 站內相關文章

- [Nuxt 3 JWT 身份驗證實作筆記：搭配 Pinia 與 Cookie 管理登入狀態](/posts/nuxt3-jwt-pinia-auth/)
- [前端與後端到底在做什麼？用餐廳來比喻網站架構](/posts/frontend-backend-explained-with-restaurant/)
- [HTTPS 與 TLS：網際網路的加密通訊協定](/posts/https-tls-explained/)
- [用 Vue 的觀念理解 Laravel：前端工程師的後端入門筆記](/posts/laravel-php-first-backend/)
