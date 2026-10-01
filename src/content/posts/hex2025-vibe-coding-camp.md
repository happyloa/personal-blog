---
title: 用 AI 開發全端天氣 App？六角 Vibe Coding 體驗營心得分享
description: 參加六角 Vibe Coding 體驗營心得：運用 AI 工具加速開發，串接中央氣象署 API 打造全端天氣預報 App 的實戰經驗。
date: 2025-11-27
updated: 2026-07-28
category: project
---

最近很多人在討論用 AI 加速開發，我也跟風參加六角學院的「[**Vibe Coding 公益程式體驗營**](https://www.hexschool.com/2025/10/03/2025-10-03-vide-coding-camp/)」。這次用 AI 做了天氣 App 的 MVP，也在和同學交流時得到一些開發上的想法。

## 專案簡介：台灣天氣預報全端系統

這次體驗營的主線任務四是開發一個**個人天氣 App 全端系統**，需要串接中央氣象署（CWA）的開放資料平台，提供台灣六都的 36 小時天氣預報。

- [氣象資料開放平臺](https://opendata.cwa.gov.tw/)
- [API 文件](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)

### 專案成果

- **前端部署網站**：[https://cwaweather-frontend.pages.dev/](https://cwaweather-frontend.pages.dev/)（後端已停止託管，目前只能看介面，查不到天氣資料）
- **後端 API**：`https://hex2025-vibe-coding-week4.zeabur.app/`（Zeabur 免費方案的託管已到期，服務目前不再運作）
- **前端原始碼**：[https://github.com/happyloa/CwaWeather-frontend](https://github.com/happyloa/CwaWeather-frontend)
- **後端原始碼**：[https://github.com/happyloa/weather-backend](https://github.com/happyloa/weather-backend)

### 功能亮點

整個系統從前到後都是自己一手包辦，主要功能包括：

**前端部分**（Nuxt 4 + TypeScript + Tailwind CSS）：

- 進站時播放 2 秒蓋版動畫
- 深淺色主題切換，配合不同時間與閱讀環境
- 六都快速切換，查看不同城市的天氣
- 響應式設計，支援手機、平板和電腦瀏覽
- AOS 滾動動畫
- Open Graph 標籤，方便社群分享

**後端部分**（Node.js + Express）：

- 串接 CWA 氣象資料開放平台
- 提供台灣六都 36 小時天氣預報
- 用環境變數管理 API Key
- RESTful API 設計，方便擴展
- 設定 CORS，讓分開部署的前後端能互相呼叫

## 開發過程：AI 工具大顯身手

這次開發最大的特色，就是全程使用 **Google Antigravity IDE** 搭配 **Claude Sonnet 4.5** 模型，外加 **Codex Cloud** 來輔助開發。

### 我的開發流程

1. **Fork 原始碼**：體驗營提供了基本的前後端框架，我先 fork 到自己的 GitHub
2. **客製化調整**：透過 AI 協助，調整配色、修改文案、更換 icon
3. **部署上線**：
   - 前端部署到 Cloudflare Pages
   - 後端部署到 Zeabur
4. **串接測試**：確保前端能成功呼叫後端 API，顯示正確的天氣資料

### AI 加速開發的關鍵

如果沒有 AI 工具，要在短時間內完成這樣的全端專案確實不容易。以下是 AI 幫了大忙的幾個地方：

1. **快速理解框架**：Nuxt 4 對我來說算是比較新的框架，透過 AI 可以快速了解專案結構、Composables 的用法、以及如何使用 TypeScript 定義型別
2. **程式碼重構**：想要調整某個功能時，AI 可以快速幫我找到相關的程式碼片段，並提供重構建議
3. **除錯協助**：遇到奇怪的錯誤訊息時，AI 可以快速分析問題所在，省下大量自己 Google 的時間
4. **UI/UX 優化**：透過 prompt 描述想要的視覺效果，AI 可以提供對應的 Tailwind CSS class 組合

## 社群互動：幫別人解決問題也是學習

除了自己的專案之外，在 Discord 社群跟同學交流也學到不少東西。

### 幫助同學排除疑難雜症

在課程進行期間，常常會看到同學在討論區提問，像是：

- 「為什麼我的前端部署後一片空白？」
- 「後端 API 回傳 CORS 錯誤怎麼辦？」
- 「環境變數要怎麼設定才不會洩漏 API Key？」

每次幫同學解決問題，其實也是在學習。有時候別人遇到的問題，正好是我之前踩過的坑，分享解決方法的過程也讓我對這些概念理解得更深了。

### 專業上的成長

這次體驗營讓我在幾個方面都有進步：

1. **問題拆解能力**：學會如何把一個大任務拆解成小步驟，逐步完成
2. **AI 協作技巧**：更了解如何下精準的 prompt，讓 AI 給出更符合需求的回答
3. **全端思維**：從 API 設計到前端呈現，學會用更全面的角度思考專案
4. **部署實戰**：實際操作 Cloudflare Pages 和 Zeabur 的部署流程

## 個人風格改造：打造獨特的天氣站

課程的 LV2 任務鼓勵我們進行「個人風格改造」，這部分真的非常有趣！

### 我的設計理念

雖然原始範例叫做「森森天氣」，但我選擇直接使用「台灣六都天氣預報」這個更直白的名稱，讓使用者一眼就知道這個服務的功能。

在視覺風格上，我採用了：

- **黑白色系配色**：支援深淺色切換，讓使用者在不同環境下都能有良好的閱讀體驗
- **卡片式設計**：清楚區分不同時段的天氣資訊
- **圖示化呈現**：透過天氣圖示讓資訊更直觀

### 技術細節

實作時，我也處理了這些細節：

1. **狀態管理**：使用 Vue 3 的 Composition API，讓狀態管理更清晰
2. **型別安全**：全面採用 TypeScript，避免隱性型別錯誤
3. **載入狀態**：實作了 Loading Skeleton，提升使用者體驗
4. **錯誤處理**：當 API 呼叫失敗時，會顯示友善的錯誤訊息

## 完課證書

經過這次體驗營的學習，我也拿到了完課證書，證書數量 +1😎

<figure>
  <img
    src="/images/posts/hex2025-vibe-coding-camp/certificate.webp"
    alt="六角學院 Vibe Coding 體驗營完課證書"
    width="843"
    height="596"
    loading="lazy"
    decoding="async"
  />
  <figcaption>六角學院 Vibe Coding 體驗營完課證書</figcaption>
</figure>

## 學習心得：擁抱 AI 時代的開發方式

參加這次體驗營，學到最多的是「**AI 協作**」的工作模式。

### AI 能做什麼？

- **加速開發**：原本可能需要一週的專案，幾天甚至幾小時內就能完成
- **降低門檻**：即使對某個框架不熟悉，也能快速上手
- **提供靈感**：卡關時可以問 AI，獲得不同的解決思路

### 但仍需注意

- **AI 不是萬能**：還是需要自己理解程式邏輯，才能判斷 AI 的建議是否正確
- **除錯能力**：遇到問題時，基本的除錯能力還是很重要
- **程式觀念**：沒有基本的程式觀念，就算 AI 給了程式碼也不知道怎麼用

## 結語

這次體驗營讓我學到了新的開發技巧，也體驗到透過社群互助帶來的成長。

如果你對 AI 開發有興趣，或是想嘗試全端專案，可以參考我的 GitHub 原始碼。

> **後記（2026 更新）**：這個專案的後端當初部署在 Zeabur 的免費方案，託管期限到期後已經停止服務，因此前端展示站雖然還開得起來，但查不到天氣資料。要實際跑起來的話，請從上面的原始碼自行部署。

---

## 相關連結

- ☁️ 氣象資料開放平臺：[https://opendata.cwa.gov.tw/](https://opendata.cwa.gov.tw/)
- 📚 API 文件：[https://opendata.cwa.gov.tw/dist/opendata-swagger.html](https://opendata.cwa.gov.tw/dist/opendata-swagger.html)
- 🌐 前端部署網站：[https://cwaweather-frontend.pages.dev/](https://cwaweather-frontend.pages.dev/)（僅供介面參考）
- 🔌 後端 API：`https://hex2025-vibe-coding-week4.zeabur.app/`（已停止託管）
- 💻 前端原始碼：[https://github.com/happyloa/CwaWeather-frontend](https://github.com/happyloa/CwaWeather-frontend)
- 💻 後端原始碼：[https://github.com/happyloa/weather-backend](https://github.com/happyloa/weather-backend)
- 🎓 六角學院：[https://www.hexschool.com/](https://www.hexschool.com/)

## 延伸閱讀

- [AI 輔助開發工具使用心得 — Claude、Cursor、Antigravity IDE 實戰分享](/posts/ai-development-tools/)
- [從零開始學 n8n — 用免費課程搭配 AI 輔助，把重複工作自動化](/posts/n8n-automation-learning/)
