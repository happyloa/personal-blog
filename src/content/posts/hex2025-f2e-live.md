---
title: 從零到有！六角學院網頁切版直播班心得 — 用 Nuxt 實戰三大專案
description: 六角學院 2025 網頁切版直播班學習全紀錄。使用 Nuxt（從 Nuxt 3 升級到 Nuxt 4）+ Tailwind CSS 實戰電商、職涯媒合與旅遊訂購三大專案的心得。
date: 2025-09-21
updated: 2026-07-28
category: project
---

最近上完了六角學院的「[**2025 網頁切版直播班**](https://www.hexschool.com/courses/web-layout-training-1st.html)」，總共做了三個專案——電商網站、職涯媒合平台、旅遊訂購系統。趁記憶還熱著，把這幾週的學習過程記錄下來。

## 課程簡介：紮實的切版訓練

這次的切版直播班不同於一般的線上課程，採用「**直播教學 + 作業實作**」的方式，讓我們能夠跟著老師的節奏，按部就班地完成每個專案。課程原本是以 HTML + CSS 搭配 Bootstrap 為主軸，這對初學者來說是非常紮實的基礎訓練。

### 技術選擇：挑戰自己的學習之路

不過我自己作業是用 **Nuxt 3/4 + Tailwind CSS** 來寫，算是給自己找點麻煩（？

這選擇讓我多踩了不少坑——Nuxt 的檔案結構、Vue 的 Composition API、Tailwind 的 utility class，每個都要花時間搞懂。但換個角度想，踩坑就是學習嘛。

雖然技術棧不一樣，但課程教的核心觀念——**元件化思維、響應式設計、怎麼把設計稿變成程式碼**——這些不管用什麼框架都用得到。

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

第一個專案是電商網站，首頁、商品列表、商品詳情、會員系統都有。做這個專案的過程中，我總算搞懂 **Nuxt 3** 的整體架構了。

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
2. **元件化開發**：學會將 UI 拆分成 Atom（小型元件）、Common（中型元件）、Layout（版面元件）三個層級
3. **響應式設計**：實作在不同裝置上都能完美呈現的介面
4. **圖片優化**：使用 TinyPNG 壓縮圖片，並採用 WebP 格式提升載入速度

做完這個專案，對 Nuxt 的專案結構總算有點概念了。

## 專案二：職旅 WorkWay — 進階表單與驗證

第二個專案是職涯諮詢媒合平台，跟第一個比起來多了不少互動功能，尤其是**表單驗證**這塊我之前沒碰過，這次算是補上了。

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

### 專業成長的關鍵

這個專案讓我在幾個方面有了顯著進步：

1. **表單驗證實戰**：學會用 VeeValidate 搭配 Yup 來定義驗證規則，從此不用自己手刻驗證邏輯
2. **狀態管理**：透過 sessionStorage 模擬登入狀態，讓我更清楚「前端要自己管理使用者狀態、之後串接真實 API 時還要處理 Token 儲存與過期」這件事，也為之後接真實後端打下一點概念
3. **使用者體驗優化**：加入了 Loading Spinner 和 AOS 滾動動畫，讓整個網站更有互動感
4. **元件複用**：學會如何設計可重複使用的元件，像是 Modal、Card 等

這次開始會想「**這個元件之後還會用到嗎？要怎麼設計才方便重複使用？**」，感覺思維有慢慢在轉變。

## 專案三：ZOBAA! 旅遊網站 — 升級 Nuxt 4 與進階應用

第三個專案的難度又上去了。這次用的是 **Nuxt 4**，還加了 Composables、Plugins、Utils 這些進階的東西。

### ZOBAA! 的主要功能與技術

這個旅遊網站包含了：

- 首頁與景點展示
- 商品介紹頁與購物車
- 會員頁面與收藏功能
- 搜尋結果頁面
- 登入/註冊系統

技術上的一大亮點是專案結構更加完整：

- **Nuxt 4**：體驗 Nuxt 4 的新特性
- **Composables**：抽離可重複使用的邏輯（如 `useAuth.ts`）
- **Plugins**：實作客戶端外掛（如 `auth.client.ts`）
- **Utils**：工具函式（如數字格式化）
- **sessionStorage** + **URL 參數**：管理購物車狀態

### 技術深度的躍進

這個專案讓我對 Nuxt 的理解提升到了新的層次：

1. **Composables 的威力**：把登入驗證邏輯抽成 `useAuth` Composable，在任何地方都能輕鬆呼叫
2. **客戶端外掛**：了解如何使用 `.client.ts` 後綴來建立只在瀏覽器執行的外掛
3. **工具函式管理**：學會用 Utils 資料夾統一管理格式化、驗證等輔助函式
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

## 學習心得：三個專案帶來的成長

上完這次直播班，我覺得「**動手做**」還是最有效的學習方式。很多東西看文件的時候覺得懂了，實際寫才發現一堆問題——但卡關的地方反而記得最清楚。

### 技能上的進步

1. **框架理解力提升**：從一開始對 Nuxt 陌生，到現在能快速建立專案、配置路由、管理元件
2. **元件化思維**：學會如何把頁面拆解成可重複使用的元件，並建立清楚的元件層級
3. **表單處理能力**：掌握了 VeeValidate + Yup 的組合技，不再害怕複雜的表單驗證
4. **狀態管理概念**：雖然還沒用到 Pinia，但透過 sessionStorage 和 Composables 已經能處理基本的狀態管理
5. **部署實戰**：三個專案都成功部署到 Cloudflare Pages，學到了如何設定環境變數、處理路由等實務問題

### 專業視野的拓展

除了技術本身，這次課程也讓我對前端開發有了更宏觀的理解：

1. **專案結構設計**：了解如何組織 pages、components、composables、utils 等資料夾
2. **開發工作流程**：從設計稿到程式碼，從本地開發到線上部署的完整流程
3. **效能優化意識**：學會使用 WebP 格式、壓縮圖片、Lazy Loading 等技巧
4. **社群分享優化**：透過 Open Graph 標籤讓網站在社群分享時有更好的呈現

### 反思與未來方向

當然，學習過程中也遇到不少挑戰：

- **Nuxt 版本差異**：從 Nuxt 3 到 Nuxt 4，有些寫法需要調整，需要多查文件
- **CSS 切版細節**：RWD 在不同裝置上的呈現有時需要反覆調整
- **除錯能力**：遇到問題時，學會善用瀏覽器開發者工具和錯誤訊息來定位問題

這些挑戰反而讓我更清楚接下來該往哪個方向精進。目前我的下一步計畫是：

- 深入學習 Nuxt 的 Server-Side Rendering 和 Static Site Generation
- 練習 Pinia 狀態管理
- 嘗試串接真實的後端 API
- 學習 TypeScript 來提升程式碼品質

## 學習成果認證

經過密集的學習與實作，很開心能順利完成課程並獲得六角學院頒發的結業證書！這不僅是對自己努力的肯定，更是未來繼續精進前端技能的動力。

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

## 結語

參加六角學院的網頁切版直播班，真的是一個很棒的決定。透過三個不同主題的專案，不僅累積了紮實的切版能力，更重要的是建立起「**從零到有完成一個專案**」的自信心。

如果你也在猶豫要不要報名類似的課程，我的建議是：**不要想太多，直接動手做就對了！** 理論看再多不如實際做一個專案，遇到問題解決問題，這樣學到的東西才會真正變成自己的。

最後，非常感謝六角學院的老師們精心設計的課程內容，以及助教們耐心的解答。期待未來能繼續精進前端技能，做出更多有趣的專案！

有興趣的朋友歡迎到我的 GitHub 看看這三個專案的原始碼，也歡迎實際玩玩看這些網站。如果有任何問題或建議，都歡迎交流討論！

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
