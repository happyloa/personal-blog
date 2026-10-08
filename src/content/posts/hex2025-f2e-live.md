---
title: 用 Nuxt 練熟切版與互動：六角學院網頁切版直播班三個作業心得
description: 已有正式專案經驗後，我用 Nuxt 3／4 與 Tailwind 完成電商、職涯媒合和旅遊網站作業，練習版面、表單與示範用的狀態管理。
date: 2025-09-21
updated: 2026-07-28
category: project
---

最近上完六角學院的「[**2025 網頁切版直播班**](https://www.hexschool.com/courses/web-layout-training-1st.html)」，做了電商網站、職涯媒合平台和旅遊訂購系統三個專案。趁還記得開發時卡住的地方，把這幾週的學習過程記下來。

報名時我已經有 Vue／Nuxt 正式專案經驗，這次是想透過不同版面的作業，把技術練得更熟。

## 課程簡介：紮實的切版訓練

這次的切版直播班不同於一般的線上課程，採用「**直播教學 + 作業實作**」的方式，讓我們能夠跟著老師的節奏，按部就班地完成每個專案。課程原本是以 HTML + CSS 搭配 Bootstrap 為主軸，這對初學者來說是非常紮實的基礎訓練。

### 作業使用的技術

不過我自己作業是用 **Nuxt 3/4 + Tailwind CSS** 來寫，算是給自己找點麻煩（？

作業和課程的技術棧不同，Nuxt 的檔案安排、Composition API 與 Tailwind class 就得自己整合，卡住時再回頭查文件。

技術棧雖然不同，課程教的元件化思維、響應式設計，以及把設計稿轉成程式碼的方法，還是能用在我的作業裡。

### 我的學習成果

在這次課程中，我總共完成了三個專案：

**第一個專案：鞋子電商網站**

- **作品展示**：[https://hex2025-f2e-live-week3and4.pages.dev/](https://hex2025-f2e-live-week3and4.pages.dev/)
- **GitHub**：[https://github.com/happyloa/Hex2025-f2e-live-week3and4](https://github.com/happyloa/Hex2025-f2e-live-week3and4)

**第二個專案：職旅 WorkWay 職涯諮詢媒合**

- **作品展示**：[https://hex2025-f2e-live-week5and6.pages.dev/](https://hex2025-f2e-live-week5and6.pages.dev/)
- **GitHub**：[https://github.com/happyloa/Hex2025-f2e-live-week5and6](https://github.com/happyloa/Hex2025-f2e-live-week5and6)

**第三個專案：ZOBAA! 旅遊網站**

- **作品展示**：[https://hex2025-f2e-live-week7and8.pages.dev/](https://hex2025-f2e-live-week7and8.pages.dev/)
- **GitHub**：[https://github.com/happyloa/Hex2025-f2e-live-week7and8](https://github.com/happyloa/Hex2025-f2e-live-week7and8)

## 專案一：鞋子電商網站 — 打好切版基礎

第一個專案是電商網站的前端切版，包含首頁、商品列表、商品詳情與會員頁面。做完之後，我比較熟悉怎麼用 Nuxt 3 組織這類多頁面作品。

### 電商網站的主要功能與技術

這個專案包含了完整的電商網站結構：

- 首頁（Landing Page）
- 商品列表頁與商品詳情頁
- 會員註冊/登入頁面
- 品牌故事與收藏頁面

在技術選型上，使用了：

- **Nuxt 3** 作為開發框架
- **Tailwind CSS** 處理樣式
- **Nuxt Swiper** 實作輪播效果
- **Nuxt Google Fonts** 引入自訂字體

### 學到的關鍵技能

1. **Nuxt 頁面路由**：了解如何使用 `pages` 資料夾來自動生成路由，比起傳統的 Vue Router 更加直觀
2. **元件拆分**：這份作業把 UI 分成 Atom（小型元件）、Common（中型元件）、Layout（版面元件）三個層級
3. **響應式設計**：調整不同螢幕尺寸下的版面，並確認實際顯示與操作
4. **圖片優化**：使用 TinyPNG 壓縮圖片，並採用 WebP 格式提升載入速度

## 專案二：職旅 WorkWay — 進階表單與驗證

第二個專案是職涯諮詢媒合平台，比第一個多了不少互動功能。這次也把表單驗證放進課程作品，練習整合欄位規則、錯誤提示和送出流程。

### WorkWay 的主要功能與技術

這個專案的核心功能包括：

- 首頁與服務方案介紹
- 關於我們與聯絡表單
- 會員頁面（含預約紀錄與方案管理）
- 登入/註冊系統

在技術上，除了延續第一個專案的技術棧，還新增了：

- **VeeValidate** + **Yup**：處理表單驗證
- **Nuxt AOS**：實作滾動動畫效果
- **sessionStorage**：模擬登入狀態

### 表單與示範狀態的練習

這個專案裡，我開始練習這些做法：

1. **表單驗證**：用 VeeValidate 搭配 Yup 統一管理欄位規則與錯誤提示，自訂的業務規則仍要自己定義
2. **狀態管理**：這份作業用 sessionStorage 模擬登入；接上真實 API 時，仍要處理 Token 的保存、過期與後端驗證
3. **使用者體驗優化**：加入了 Loading Spinner 和 AOS 滾動動畫，讓整個網站更有互動感
4. **元件複用**：練習拆分 Modal、Card 等共用元件

## 專案三：ZOBAA! 旅遊網站 — 升級 Nuxt 4 與進階應用

第三個作業用 **Nuxt 4**，也更完整地運用 Composables、Plugins、Utils，把登入狀態和工具函式整理到各自的位置。

### ZOBAA! 的主要功能與技術

這個旅遊網站包含了：

- 首頁與景點展示
- 商品介紹頁與購物車
- 會員頁面與收藏功能
- 搜尋結果頁面
- 登入/註冊系統

這次也把專案結構整理得更完整：

- **Nuxt 4**：體驗 Nuxt 4 的新特性
- **Composables**：抽離可重複使用的邏輯（如 `useAuth.ts`）
- **Plugins**：實作客戶端外掛（如 `auth.client.ts`）
- **Utils**：工具函式（如數字格式化）
- **sessionStorage** + **URL 參數**：管理購物車狀態

### 把邏輯放在適合的位置

我在這個專案裡學到怎麼分配這些程式碼：

1. **共用邏輯**：把登入狀態邏輯抽成 `useAuth` Composable，在合適的 Nuxt context 中共用
2. **客戶端外掛**：了解如何使用 `.client.ts` 後綴來建立只在瀏覽器執行的外掛
3. **工具函式管理**：把格式化、驗證等輔助函式集中到 Utils 資料夾
4. **狀態管理進階**：結合 sessionStorage 與 URL 參數（如 `?hasItems`）來控制不同的頁面狀態
5. **Nuxt 4 的新特性**：體驗到框架升級後帶來的效能提升與開發體驗改善

這個專案比前兩個都複雜，不過也學到比較多東西。

## 技術棧總整理：從基礎到進階

回顧一下這三個專案用到的技術：

### 核心技術

- **框架**：Nuxt 3 → Nuxt 4（隨著課程進度升級）
- **樣式**：Tailwind CSS（全專案採用 Utility-First 的設計方式）
- **開發工具**：VS Code + Vue Official + Nuxtr + Tailwind CSS IntelliSense

### 常用套件

從專案一到專案三，逐步累積使用的套件：

1. **基礎套件**（所有專案都用到）
   - Nuxt Google Fonts：引入 Google 字體
   - Nuxt Swiper：實作輪播效果
2. **進階套件**（專案二、三）
   - VeeValidate + Yup：表單驗證
   - Nuxt AOS：滾動動畫

3. **專案三更完整運用**
   - Composables、Plugins、Utils 等目錄結構（Nuxt 3 起就有，但這次才真正用上）

### 設計與優化工具

- **TinyPNG**：圖片壓縮
- **SVG Viewer**：SVG 檔案檢視與編輯
- **Adobe Photoshop**：圖片編輯（專案三使用）
- **ChatGPT**：輔助除錯與程式碼優化

## 這次練習補了哪些部分

上完直播班，我還是覺得自己動手做最有用。看文件時以為懂了，實際寫才發現很多地方接不起來，而那些卡關的地方反而記得最清楚。

### 技能上的進步

1. **框架實作更熟悉**：在三個作業裡反覆練習建立專案、配置路由與管理元件
2. **元件拆分**：反覆練習頁面與共用元件的界線
3. **表單處理**：多練幾種 VeeValidate + Yup 的欄位規則與錯誤提示
4. **狀態管理概念**：這幾個作業沒有用 Pinia，主要透過 sessionStorage 和 Composables 處理示範用的狀態
5. **部署**：三個專案都部署到 Cloudflare Pages，也練習環境變數設定與路由的檢查

### 專業視野的拓展

除了學套件，這次也練到專案裡常需要一起考慮的事情：

1. **專案結構設計**：了解如何組織 pages、components、composables、utils 等資料夾
2. **開發工作流程**：從設計稿到程式碼，從本地開發到線上部署的完整流程
3. **圖片載入**：在作業裡使用 WebP、圖片壓縮與 Lazy Loading
4. **社群分享優化**：透過 Open Graph 標籤讓網站在社群分享時有更好的呈現

### 反思與未來方向

當然，學習過程中也遇到不少挑戰：

- **Nuxt 版本差異**：從 Nuxt 3 到 Nuxt 4，有些寫法需要調整，需要多查文件
- **CSS 切版細節**：RWD 在不同裝置上的呈現有時需要反覆調整
- **除錯**：用瀏覽器開發者工具與錯誤訊息定位問題

做完課程作品後，我想再多練習這些部分：

- 深入學習 Nuxt 的 Server-Side Rendering 和 Static Site Generation
- 多練 Pinia 與頁面狀態的整合
- 嘗試串接真實的後端 API
- 多練 TypeScript 的型別設計與檢查

這三個作品主要用來練前端版面與互動。sessionStorage 的登入狀態和 URL 裡的購物車參數都只是示範，不能當成後端認證、價格核對或庫存控制。接上真實 API 時，仍要由伺服器驗證權限與交易資料。

## 學習成果認證

完成這幾週的作業後，我拿到了六角學院的結業證書，蠻開心的。三個專案都順利做完，也讓我比較有信心繼續學下去。

<figure>
  <img
    src="/images/posts/hex2025-f2e-live/certificate.webp"
    alt="六角學院 2025 網頁切版直播班結業證書"
    width="843"
    height="596"
    loading="lazy"
    decoding="async"
  />
  <figcaption>六角學院 2025 網頁切版直播班結業證書</figcaption>
</figure>

這次最有用的地方，是有三份不同主題的設計稿可以反覆做。已有工作經驗，也還有值得練熟的版面和互動細節。謝謝六角學院老師與助教，三個作品和原始碼都放在下面。

---

## 相關連結

### 課程資訊

- 🎓 六角學院 2025 網頁切版直播班：[https://www.hexschool.com/courses/web-layout-training-1st.html](https://www.hexschool.com/courses/web-layout-training-1st.html)

### 專案一：鞋子電商網站

- 🌐 線上展示：[https://hex2025-f2e-live-week3and4.pages.dev/](https://hex2025-f2e-live-week3and4.pages.dev/)
- 💻 GitHub 原始碼：[https://github.com/happyloa/Hex2025-f2e-live-week3and4](https://github.com/happyloa/Hex2025-f2e-live-week3and4)

### 專案二：職旅 WorkWay 職涯諮詢媒合

- 🌐 線上展示：[https://hex2025-f2e-live-week5and6.pages.dev/](https://hex2025-f2e-live-week5and6.pages.dev/)
- 💻 GitHub 原始碼：[https://github.com/happyloa/Hex2025-f2e-live-week5and6](https://github.com/happyloa/Hex2025-f2e-live-week5and6)

### 專案三：ZOBAA! 旅遊網站

- 🌐 線上展示：[https://hex2025-f2e-live-week7and8.pages.dev/](https://hex2025-f2e-live-week7and8.pages.dev/)
- 💻 GitHub 原始碼：[https://github.com/happyloa/Hex2025-f2e-live-week7and8](https://github.com/happyloa/Hex2025-f2e-live-week7and8)

## 延伸閱讀

- [Figma to Code 工作流程分享](/posts/figma-to-code-workflow/)
- [藝術銀行 Art Bank 會員系統開發紀錄 — Nuxt 3 + JWT 實戰經驗](/posts/artbank-nuxt3-ssr-development/)
