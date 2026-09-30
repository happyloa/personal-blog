---
title: 藝術銀行 Art Bank 會員系統開發紀錄 — Nuxt 3 + JWT 實戰經驗
description: 分享藝術銀行會員系統開發經驗，包含 Nuxt 3 SSR 架構選型、JWT + Pinia 登入狀態設計，以及公司戶／個人戶複雜表單的處理心得。
date: 2025-01-15
category: project
---

去年底接到一個蠻有挑戰性的案子——[藝術銀行 Art Bank](https://artbank.tfaf.org.tw/) 的會員前台系統開發。這是跟版塊設計合作的專案，從 2024 年底開始做，一直到 2025 年初才完成。藝術銀行是文化部的藝術作品租賃平台，讓公司和個人可以線上租借藝術品。這篇來分享一下我負責的會員系統開發過程。

## 我負責的部分

這個專案我主要負責的是會員前台的功能，包含：

- 會員登入與註冊流程
- 公司戶與個人戶的不同註冊表單
- 會員收藏藝術作品功能
- 會員中心相關頁面
- 藝術作品租賃流程表單

API 是別的工程師在處理，我就專注在會員相關的功能上。

## 技術選型考量

專案使用 **Nuxt 3** 搭配 **Tailwind CSS**，這些技術不是我決定的，但用下來覺得蠻適合這種需要 SEO 的政府網站。Nuxt 3 的 SSR 機制讓搜尋引擎可以正確抓取頁面內容，這對藝術品的曝光來說很重要。

Tailwind CSS 用過之後才發現，原來切版也可以這麼順。以前寫傳統 CSS 常常要在檔案之間跳來跳去，現在直接在元件上寫 class 就搞定了。搭配元件化開發的話，維護起來也很方便，尤其是這種多人協作的專案，不用擔心改到別人的 style。

## 會員系統的挑戰

這個專案的會員系統最麻煩的地方，在於要同時處理公司戶和個人戶兩種身份。兩者需要填的資料完全不同，公司戶要填統編、公司名稱、負責人等等，個人戶則是一般的個人資料。

### VeeValidate 表單驗證

表單驗證用的是 VeeValidate 搭配 Yup，這個組合在 Vue 生態系應該算是標配了。但這個專案的表單比較複雜，因為公司戶和個人戶的欄位不同，驗證規則也要跟著動態切換。

舉例來說，選擇公司戶的時候，統一編號就是必填欄位，而且要驗證格式；選擇個人戶的時候，這個欄位就不需要了。這種動態驗證規則的切換，一開始踩了不少坑。

後來的做法是用 Yup 的 `when` 方法來做條件驗證，根據使用者選擇的身份類型，動態套用不同的驗證 schema：

```typescript
import * as yup from "yup";

const schema = yup.object({
  memberType: yup.string().required(),
  taxId: yup.string().when("memberType", {
    is: "company", // 公司戶時才驗證
    then: (schema) =>
      schema
        .required("請輸入統一編號")
        .matches(/^\d{8}$/, "請輸入 8 位數字的統一編號"),
    otherwise: (schema) => schema.notRequired(),
  }),
  companyName: yup.string().when("memberType", {
    is: "company",
    then: (schema) => schema.required("請輸入公司名稱"),
    otherwise: (schema) => schema.notRequired(),
  }),
});
```

這樣寫法比較乾淨，也比較好維護。

另外，錯誤訊息的顯示也花了一些心思。不只是要顯示「這個欄位必填」，而是要給出有意義的提示，讓使用者知道該怎麼修正。像是統編格式錯誤的時候，就要明確說「請輸入 8 位數字的統一編號」（因為統編一定是 8 位數字）。

## 登入驗證架構

驗證這塊選用 JWT，搭配 **Pinia** 來管理登入狀態，用 `useCookie` 讓 SSR 和 CSR 的 token 可以同步。這個架構的好處是全站任何地方都能方便地存取登入狀態，而且重新整理頁面時也能自動恢復。

關於 JWT + Pinia + Cookie 的完整實作細節（包含自動帶 token、權限控制、初始化登入狀態等），我在另一篇文章有更詳細的說明：[Nuxt 3 JWT 身份驗證實作筆記](/posts/nuxt3-jwt-pinia-auth/)。

## 收藏功能實作

會員收藏藝術品的功能也是我負責的部分。這個功能看起來簡單，但實際做起來有一些眉角。

首先是狀態同步的問題。使用者點了愛心收藏之後，要馬上更新 UI，不能等 API 回傳才改變。所以採用樂觀更新的策略，先把 UI 改掉，如果 API 失敗再 rollback。

另外，收藏清單要能夠即時反映藝術品的狀態，像是這件作品是不是已經被租走了、價格有沒有變動等等。這邊透過 API 把最新狀態帶回來，前端再去更新顯示。

## Nuxt 3 開發心得

這個專案讓我對 Nuxt 3 有更深入的理解。以前用 Nuxt 2 的時候，Options API 寫久了會覺得沒什麼，但 Nuxt 3 搭配 Composition API 和 TypeScript，整個開發體驗提升很多。

這邊要特別提一個 `useFetch` 的坑。預設情況下，`useFetch` 會 watch 傳入的參數，只要參數有變化就會自動重新打 API。這聽起來很方便，但在表單的情境下就會出問題——使用者每改一個欄位的值，就會觸發一次 API 請求，這完全不是我們要的行為。解法是把 `watch` 選項設成 `false`：

```typescript
const formData = ref({ name: "", email: "" });

const { data, execute } = await useFetch("/api/submit", {
  method: "POST",
  body: formData,
  watch: false, // 關閉自動 watch，避免每次改值都打 API
  immediate: false, // 也不要立即執行
});

// 表單送出時才手動呼叫
const handleSubmit = async () => {
  await execute();
};
```

這樣就只會在手動呼叫 `execute()` 的時候才打 API。

還有一個常遇到的問題是 hydration mismatch。因為 SSR 和 CSR 的環境不同，有些東西在 server 端和 client 端會產生不一致。像是用到 `window` 或 `document` 的地方，就要用 `import.meta.client` 來判斷（Nuxt 3 現在建議用這個取代舊的 `process.client`），或是用 `ClientOnly` 元件包起來。

## 效能優化

雖然我主要負責會員系統，但也順手做了一些效能優化。會員中心頁面一開始載入蠻慢的，主要是因為一次撈了太多資料。

後來改成分頁載入，每次只撈當頁需要的資料。另外也加了 Skeleton Loading，在資料還沒回來之前先顯示骨架屏，讓使用者知道頁面正在載入中。這樣體驗比一片空白好很多。

圖片載入也做了懶載入，只有滾到可視範圍內的圖片才會真正去載入。這對收藏清單這種有大量圖片的頁面來說，改善很明顯。

## 遇到的問題與解法

開發過程中遇到最頭痛的問題，大概是公司戶註冊表單更深一層的複雜驗證邏輯。前面提到的 `yup.when()` 只處理了 memberType 這一層分支，但實際上還有些欄位彼此之間也有相依性，像是選了某個選項之後，另一個欄位才會變成必填，光靠 `when()` 疊 `when()` 會越寫越難懂。

一開始想說再用 `watch` 來監聽這些欄位變化，但寫到後來發現邏輯越來越亂。後來重構成用 computed 來統一算出當下該套用的驗證 schema，再搭配 VeeValidate 的 `useForm` 來套用，這樣邏輯比較集中，也比較好 debug。

另一個問題是登入狀態在不同頁面之間的同步。有時候使用者在 A 頁面登入，跳到 B 頁面的時候狀態卻沒有帶過去。後來發現是 SSR 的問題，server 端 render 的時候拿不到 cookie。解法是把讀取 cookie 的邏輯放在 middleware 裡面處理。

## 學到什麼

這個專案做下來，對 Nuxt 3 的 SSR 機制理解更深了。尤其是 hydration 的原理、server 和 client 端的差異、狀態同步等等，這些以前只是知道大概，現在算是有實戰經驗了。

另外也體會到，大專案的表單處理真的不簡單。動態驗證規則、欄位相依性、錯誤訊息客製化，這些加在一起會讓程式碼變得很複雜。提早規劃好架構，把邏輯拆分清楚，後面維護才會輕鬆。

---

專案連結：[https://artbank.tfaf.org.tw/](https://artbank.tfaf.org.tw/)

站內相關文章：

- [Nuxt 3 JWT 身份驗證實作筆記](/posts/nuxt3-jwt-pinia-auth/)
- [Figma to Code 工作流程分享](/posts/figma-to-code-workflow/)
- [Vue i18n 多語系開發](/posts/vue-i18n-multilingual/)
