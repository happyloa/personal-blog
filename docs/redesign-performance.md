# Journal 改版：效能與驗收紀錄

2026-11-01（台北時間）。本次改版保留 Astro 靜態站，新增文章總覽與分頁，首頁改為最新 6 篇，文章頁採用 720px 版心、桌機 sticky 目錄與手機原生 `<details>`。39 篇文章的檔案、正文、frontmatter、網址和分類均未修改。

## 版本與環境

- 分支：`feat/blog-editorial-redesign`；起點為 `main` 的 `ecb582543af1f8bb2ae7ea971b228044bb671176`。開始時工作目錄乾淨；遠端 `main` 仍為這個 SHA。
- 改版後程式碼：`f9cd1cba9945b2d77a888c56f3dfc2327d179b2f`。後續驗證、報告與截圖提交不改動網站程式。
- Windows 11 Home 10.0.26300、Intel Core i9-14900（24 核心／32 執行緒）、64 GiB 記憶體。
- Node 24.21.0、npm 11.19.0、Chrome 144.0.7559.133、Lighthouse 13.6.0。
- 本機 gzip 靜態伺服器實際套用 `public/_headers`，包含 CSP。Before 使用封存的原始 `dist` 與 `http://127.0.0.1:4322`；After 使用新版正式輸出與 `http://127.0.0.1:4323`。
- Lighthouse 預設手機模擬：412 × 823 CSS px、DPR 1.75、模擬 throttling、4 倍 CPU 降速、150ms RTT、1638.4 Kbps throughput。每組獨立啟動乾淨 Chrome，量測三次取中位數。

安裝時原有 `node_modules` 的 native 模組被 Windows 鎖住。原目錄保留在忽略的 `.lighthouse/prior-node_modules`，隨後 `npm ci` 成功，lockfile 未改動。本機 Node 符合 repo 的最低 22.23.4；SDD 的 Node 24 為建議環境，已採用。

## 實測結果

以下五組在改版前、後的每次量測，效能／無障礙／最佳實務／SEO 均為 **100／100／100／100**。LCP 以下列三次中位數顯示，毫秒以下的差異不具實務意義。所有 TBT 都是 0ms。

| 頁面           | Before 路徑                           | After 路徑 | LCP 前 → 後（ms） |         CLS 前 → 後 |
| -------------- | ------------------------------------- | ---------- | ----------------: | ------------------: |
| 首頁           | `/`                                   | `/`        | 1503.40 → 1503.08 | 0.001145 → 0.000709 |
| 一般長文       | `/posts/database-systems-comparison/` | 同左       | 1503.37 → 1503.03 | 0.000629 → 0.000928 |
| Mermaid 多圖文 | `/posts/how-browser-renders-webpage/` | 同左       | 1503.38 → 1502.86 | 0.000609 → 0.000704 |
| 文章總覽       | `/`（舊版全文章列表）                 | `/posts/`  | 1503.27 → 1502.66 | 0.001145 → 0.000241 |
| 分類索引       | `/categories/`                        | 同左       | 1502.69 → 1502.70 | 0.000344 → 0.000481 |

舊版沒有 `/posts/`，文章總覽的 Before 是首頁全列表的代理比較，不能視為同路徑回歸量測。其餘四組同路徑比較，LCP 沒有超過 0.2 秒退步，CLS 均小於 0.02。一般長文與分類的 CLS 微增，仍低於 0.001。

2026-10-25 文件記錄的效能為 98／98／99、LCP 約 2.1–2.3 秒；這次重測的舊版本身已是 100、約 1.50 秒。工具版本、網路與字型快取、主機負載都可能造成差異，本次未隔離出單一原因，因此使用本次同環境 Before／After，沒有把歷史數字當作這次的改善幅度。

以上是本機實驗室數據。線上真實使用者 p75 的 LCP、INP、CLS **尚未取得**；TBT 不能代替 INP。完整的指標定義見 [Web Vitals 官方文件](https://web.dev/articles/vitals)。

## 傳輸與工程預算

下表以相同 Node gzip 設定壓縮本機檔案；JS 包含 Lighthouse 實際首載請求的站內模組，CSS 為站內正式樣式表。單位為 bytes，沒有把整包尚未載入的 Mermaid 算進首載。檔案級資料、三次原始指標與資源請求數見 [redesign-metrics.json](redesign-metrics.json)。

| 項目        | Before gzip | After gzip |   增量 | SDD 增量預算 |
| ----------- | ----------: | ---------: | -----: | -----------: |
| 首頁 JS     |       9,509 |      8,530 |   −979 |      ≤ 5 KiB |
| 一般文章 JS |      10,256 |      8,888 | −1,368 |      ≤ 5 KiB |
| 站內 CSS    |       9,049 |      8,883 |   −166 |      ≤ 8 KiB |
| 首頁 HTML   |      10,670 |      4,791 | −5,879 |     ≤ 10 KiB |

首頁未壓縮 HTML 為 50,264 → 16,740 bytes，減少 33,524 bytes。一般文章未壓縮 HTML 為 38,264 → 35,624 bytes。首頁 JS 請求維持 4 個，一般文章維持 5 個；瀏覽器記錄的 JS 傳輸量（含 HTTP 開銷）分別為 12,683 → 11,704 bytes、14,223 → 12,855 bytes。

字型策略與請求網域維持原狀。新版首頁首筆報表共 36 個請求、約 1.07 MiB 傳輸，其中字型為 28 個請求、約 1,004 KiB。外部 Noto Sans TC 仍是主要傳輸來源；這次沒有新增字型，也沒有以更改 CJK 策略換取分數。Google Fonts 的 CSS 與分片回應仍會變動，完整資源表保留於 JSON。

新全域互動沒有引入框架或動畫套件，`package-lock.json` 與所有 runtime dependencies、overrides 不變。Tailwind 掃描限定於 `src`，避免測試與報告中的文字改變正式 CSS；此設定依據 [Tailwind 的 source() 說明](https://tailwindcss.com/docs/detecting-classes-in-source-files#setting-your-base-path)。

### 背景取捨

先對舊版桌機首頁記錄 10 秒閒置、180 次滑鼠移動與 30 次捲動。閒置 rAF 增量為 0，主執行緒 TaskDuration 約增加 2.42ms，JS heap 約增加 896 bytes；沒有證據顯示 Canvas 是閒置效能瓶頸。

移動階段耗時約 6.17 秒，rAF 回呼 371 次、累計約 94.1ms；捲動與等待階段約 5.30 秒，回呼 67 次、累計約 18.1ms。這些是整頁 rAF 與 Chrome 指標，未做 Canvas 開關對照，不能全數歸因於光暈。移除互動 Canvas 的原因是讓閱讀背景安靜、簡化全站腳本；靜態 48px 淡格線保留。原始 trace 與快照位於 `.lighthouse/grid-before/`。

## 自動化與瀏覽器驗證

| 檢查                          | 結果與範圍                                                                                                                                   |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm ci`                      | 成功；依原 lockfile 安裝                                                                                                                     |
| `npm run format:check`        | 通過；沒有批次格式化文章                                                                                                                     |
| `npm run check`               | 0 errors、0 warnings、0 hints                                                                                                                |
| `npm run test:dependencies`   | 3 項通過；保留 KaTeX 與 selector parser 安全回歸                                                                                             |
| `npm run build`               | 52 頁；原為 48 頁，新增總覽與第 2–4 頁                                                                                                       |
| `npm run test:build`          | 6 組通過；涵蓋文字／Shiki／焦點色對比、所有 39 篇、靜態分頁、metadata、RSS、sitemap、分類 noindex、目錄錨點、可聚焦 code、全站內部連結與資源 |
| `npm run test:draft`          | 實際新增一篇暫存 `draft: true`、建置並跑輸出測試，確認草稿不公開；測試檔以 `finally` 移除，不留文章改動                                      |
| `npm audit --audit-level=low` | 0 漏洞                                                                                                                                       |
| HTTP 與原始碼保護             | 39 篇文章全部回應 200；原文章、內容 schema、分類定義、RSS、sitemap integration、`astro.config.mjs`、安全標頭與 lockfile 對起點的 diff 均為空 |

Chrome 自動化通過以下情境，結果保留於 `.lighthouse/browser/results.json`，並收錄於 metrics JSON：

- 360／390／768／1024／1280／1440px，每個尺寸檢查首頁、總覽、第 2 頁、分類索引、單篇分類、一般長文與 404，共 42 個頁面尺寸組合。沒有 body 水平溢出，每頁一個 h1，目錄在 1280px 正確切換。
- Tab、Shift+Tab、Enter、Escape；skip link 聚焦主內容；手機 `<details>` 可用鍵盤展開與跳章；長 code 的原生水平捲動與焦點框。
- 1440px 螢幕在 200% 縮放的等效排版測試：720px CSS viewport、DPR 2。這不是操作瀏覽器工具列的原生 zoom 測試。
- 長字串標題與摘要壓力測試、reduced motion、forced colors 焦點框。
- 關閉 JavaScript 後以原生連結換到第 2 頁，仍有 12 篇；文章目錄仍可展開與跳錨點。
- 同時封鎖字型、移除 IntersectionObserver：文章可讀、目錄可操作、Mermaid 仍由 fallback 渲染全部圖表。
- 首頁未請求 Mermaid chunk；圖表接近畫面後渲染，原始碼可展開；封鎖 Mermaid chunk 時保留可讀原始碼。
- ClientRouter 連續三次往返總覽與文章，目錄觀察器重新初始化；沒有未預期的瀏覽器例外或 CSP 錯誤。測試先等待原生轉場動畫完成再點擊，避免轉場期間的點擊攔截造成誤判。生命週期依據 [Astro 官方說明](https://docs.astro.build/en/guides/view-transitions/#lifecycle-events)。
- 不存在的網址回應 404 並保留 noindex。

`public/_headers` 未修改；預覽伺服器載入它以驗證實際 CSP，不加入 `unsafe-eval` 或放寬 script-src。Pages 的套用行為可參考 [官方 headers 文件](https://developers.cloudflare.com/pages/configuration/headers/)。

另沿用本機既有 Playwright 1.64.1 與對應的 Firefox 157、WebKit 27.2，驗證 390／768／1440px 的首頁、總覽、第 2 頁、分類索引與一般文章，共 30 個頁面尺寸組合。兩個引擎也通過無 JS 分頁與目錄、Mermaid 懶載入／原始碼保留、reduced motion，以及透過 ClientRouter 離開再進入圖表文章後的渲染。這是桌面引擎自動化，WebKit 結果不能當作 Safari iOS 實機驗收。結果位於 `.lighthouse/cross-browser/results.json`，並收錄於 metrics JSON。

## 截圖

已檢視以下六張原始 PNG，首頁與列表為全頁截圖，文章為首屏；手機文章目錄已展開。

| 畫面       | 桌機 1440px                                       | 手機 390px                                       |
| ---------- | ------------------------------------------------- | ------------------------------------------------ |
| 首頁       | [桌機首頁](redesign-screenshots/home-1440.png)    | [手機首頁](redesign-screenshots/home-390.png)    |
| 文章列表   | [桌機列表](redesign-screenshots/archive-1440.png) | [手機列表](redesign-screenshots/archive-390.png) |
| 文章與目錄 | [桌機文章](redesign-screenshots/article-1440.png) | [手機文章](redesign-screenshots/article-390.png) |

## 重跑方式與原始報表

大體積 Lighthouse HTML／JSON／trace／DevTools logs 留在 Git 忽略的 `.lighthouse/before/` 與 `.lighthouse/after/`；中途版本在 `.lighthouse/after-interim/`，未混入最終比較。Before／After 的正式輸出封存於 `.lighthouse/before-dist/`、`.lighthouse/after-dist/`。可攜的數值摘要與截圖已納入版本控制。

一般檢查：

```powershell
$env:ASTRO_TELEMETRY_DISABLED = '1'
npm ci
npm run format:check
npm run check
npm run test:dependencies
npm run build
npm run test:build
npm run test:draft
npm audit --audit-level=low
```

量測工具採用獨立的開發用 Lighthouse，沒有加入網站依賴。可使用既有安裝，或放在忽略的工具目錄：

```powershell
npm install --prefix .lighthouse/tools --no-save --no-package-lock lighthouse@13.6.0
$env:LIGHTHOUSE_MODULE_ROOT = (Resolve-Path .lighthouse/tools/node_modules).Path
$env:CHROME_PATH = 'C:\Program Files\Google\Chrome\Application\chrome.exe'
node scripts/preview-static.mjs dist 4323
```

另一個終端執行：

```powershell
node scripts/measure-performance.mjs after http://127.0.0.1:4323 .lighthouse/after-new-run
node scripts/verify-browser.mjs http://127.0.0.1:4323
node scripts/measure-bundle.mjs .lighthouse/before-dist dist .lighthouse/before .lighthouse/after-new-run
```

跨瀏覽器補測使用可讀取的既有 Playwright Core 安裝及相符瀏覽器 binaries：設定 `$env:PLAYWRIGHT_MODULE_ROOT` 為該 `playwright-core` 套件目錄，再執行 `node scripts/verify-cross-browser.mjs http://127.0.0.1:4323`。本次只讀取現有工具，沒有安裝套件或修改提供工具的其他儲存庫。

量測腳本會沿用指定輸出目錄中已存在的報表。程式碼或環境改變後應指定新的空目錄。重建 Before 時請在獨立目錄檢出起點 SHA，再依原 lockfile 安裝、建置、封存；不要覆蓋目前分支或使用者檔案。以 `before` 標籤量測時，archive 組會使用舊首頁。

## 提交與待驗收項目

| 階段    | Commit    | 主要內容                                                                            |
| ------- | --------- | ----------------------------------------------------------------------------------- |
| Phase 1 | `bde12b6` | 暖黑／珊瑚橘 tokens、字標、Header／Footer、靜態 Hero                                |
| Phase 2 | `14ac006` | 首頁 6 篇、每頁 12 篇的 4 頁總覽、穩定排序、分類與單一連結列表                      |
| Phase 3 | `8584dbf` | 文章版心、原生手機目錄、sticky 桌機目錄、精簡觀察器、Mermaid 色彩、404、移除 Canvas |
| Phase 4 | `f9cd1cb` | 建置／草稿測試與 CI、量測工具、CSS 掃描範圍與 12px 輔助字級                         |

每個實作階段均通過 Astro check 與正式建置；Phase 2 起另執行依賴回歸。報告與截圖以後續文件提交交付。

目前尚未完成 Safari iOS／Chrome Android 實機操作、螢幕閱讀器人工走查、原生 200% 縮放、正式站部署後的 headers／效能與真實使用者 p75 驗收。本機結果不能取代這些項目。P2 搜尋、複製程式碼與閱讀進度條依規格延後，沒有加入。

Skill 更新檢查：humanizer 3.1.0 已與原作者 `blader/humanizer` 上游全文比對一致；Sites 1.1.2 為受管理插件，當前工具未提供插件更新介面；web-perf 的本機安裝缺少可確認來源紀錄，後兩者的更新狀態未確認。網站使用本機開發流程，沒有另建 Sites 託管或部署正式站。
