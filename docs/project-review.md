# 專案與內容檢查

2026-10-25 檢查本站設定、共用版型、載入腳本、建置產物、README 與 39 篇文章，使用 `web-perf` 和 `humanizer`。兩個 skill 均已與原作者上游比對，內容一致。

## 已修正

- 文章目錄缺少 `IntersectionObserver` 降級處理。現在不支援時仍能開合目錄、操作連結與按 Escape 關閉，只略過章節高亮；圖表也維持原有備援。
- 加入 `.node-version`，讓 CI 和 Cloudflare Pages 使用 Node.js 24。Pages 的預設 Node 版本低於目前 Astro 的要求，不能只靠 `package.json` 的 engines 選版；後台若另設 `NODE_VERSION`，需同步使用 24.x。依據見 [Cloudflare 建置環境文件](https://developers.cloudflare.com/pages/configuration/build-image/)。
- 刪除已不存在於依賴樹的 `esbuild` 安裝腳本核准，以及 README 的過時說明。
- 修正字型設定註解：外部 CSS 可以在本站跨頁快取，不應宣稱能跨站共用快取。Chrome 採用[分區快取](https://developer.chrome.com/blog/http-cache-partitioning/)。
- 精簡首頁與 12 篇文章的重複敘述。AI 風險系統的正文補上標題已有的 React／FastAPI 分工；TCP 握手比喻改為確認收送能力，身分驗證由 TLS 處理。RAG 文章改為依個別模型規格確認視窗容量，移除「主流普遍一百萬」的概括。

文章檔名、YAML metadata、分類、日期、連結目標、圖片來源、程式碼與指令已逐一比對，均保持原樣。Nuxt、React、WordPress 等文章記錄的是其他專案或教學範例，與本站使用 Astro 並不衝突；既有版本背景、示範限制、主觀數字的註記和個人語氣予以保留。

## 本機效能

Windows、Node.js 24.21.0、Chrome 144、Lighthouse 13.5.0。使用正式 `dist/`、gzip 與本站 `_headers`，採 Lighthouse 預設手機模擬和四倍 CPU 降速。每頁量測三次，分數與各指標分別取中位數。

| 頁面                 | 效能 | 無障礙 | 最佳實務 | SEO |     LCP |    CLS |
| -------------------- | ---: | -----: | -------: | --: | ------: | -----: |
| 首頁                 |   98 |    100 |      100 | 100 | 2.14 秒 | 0.0011 |
| 一般文章：資料庫比較 |   98 |    100 |      100 | 100 | 2.28 秒 | 0.0006 |
| 圖表文章：瀏覽器渲染 |   99 |    100 |      100 | 100 | 2.12 秒 | 0.0006 |

三頁的 FCP 約 1.50 秒，TBT 均為 0 ms。效能分數三次依序為首頁 98／98／99、一般文章 98／98／99、圖表文章 99／98／99。這些是本機實驗室結果，未量測線上實際使用者的 INP，也不能代表所有文章、裝置與網路。

建置仍提示 Mermaid 的大型動態 chunk；目前使用圖表接近畫面才載入的方式，未因這個提示改動分割策略。Lighthouse 的未使用 CSS 項目來自 Google Fonts 樣式表，不能直接視為可以刪除的本站樣式。

## 驗證

格式、Astro 型別檢查、三項依賴安全測試與 48 頁正式建置通過。靜態產物另檢查了單一 H1、重複 ID、圖片尺寸與替代文字、JSON-LD、metadata、頁內錨點、Sitemap，以及 1,018 個站內連結與資源。

Chrome 驗證涵蓋手機與桌機版面、字型套用、ClientRouter 換頁、目錄焦點與 Escape、延遲載入圖表與原始碼、CSP、缺少 IntersectionObserver、減少動態效果與停用 JavaScript。並檢視手機首頁、圖表與桌機首頁截圖。

原始報告、截圖和驗證腳本保留在不納入 Git 的 `.lighthouse/`。本輪沒有重新部署或逐一執行文章提到的外部專案，也沒有獨立查核作者的工作經歷、引述與績效數字。
