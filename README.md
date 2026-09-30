# 個人部落格（Astro 7 + Tailwind 4）

線上網址：**<https://blog.worksbyaaron.com>**

以 Astro 7 建置的靜態部落格，文章內容來自 `src/content/posts` 的 Markdown 檔，並運用 Tailwind CSS 4（透過 Vite plugin）進行樣式客製化。整合了目錄（TOC）、Mermaid 圖表、RSS、Sitemap 與結構化資料，打造高效能且 SEO 友善的個人網站。

字型採混合策略：

- **拉丁字型**（Inter / Outfit / JetBrains Mono）透過 Astro 內建的 Fonts API 於 build 時下載並自架，毋須安裝 `@fontsource` 套件。
- **中文思源黑體**（Noto Sans TC）走外部 Google Fonts `<link>`，讓中文字型 CSS 可跨頁快取。首次建置拉丁字型需要連線 Google Fonts；讀者端載入中文字型也需要連線 Google，無法載入時會使用系統字型。

## 主要特色

- **核心架構**：Astro 7 + Tailwind CSS 4；工具與客戶端腳本使用 JavaScript + JSDoc，部分 `.astro` 元件使用 TypeScript 的 Props 型別宣告
- **內容管理**：使用 Content Collections 管理 Markdown 文章，具備 Zod 資料驗證
- **效能優化**：靜態生成（SSG）、字型自架、RSS 與 Sitemap 自動輸出
- **閱讀體驗**：
  - 自動生成目錄（TOC），支援桌面版固定目錄與行動版彈出選單
  - 閱讀時間估算；未填 description 時，使用內文第一個非空行轉為純文字摘要
  - Mermaid 圖表支援
  - 簡潔深色介面，適合長時間閱讀與維護
- **SEO 與分享**：
  - 完整的 Open Graph 與 Twitter Card 設定
  - JSON-LD 結構化資料（WebSite / Person / BlogPosting / BreadcrumbList）
  - 自動生成 `sitemap-index.xml`、`sitemap-0.xml`（文章含 `lastmod`）與 `rss.xml`
  - 文章數少於 2 篇的分類頁掛 `noindex`；sitemap 讀取正式 HTML 的 robots 與文章日期，確保輸出一致

## 環境需求

- Node.js 22.12 以上（Astro 7 要求，建議使用 LTS 版本）
- npm 10 以上

## 本地開發流程

1. **安裝相依套件**

   ```bash
   npm ci
   ```

2. **啟動開發伺服器**

   ```bash
   npm run dev
   ```

   預設埠號為 `4321`，支援熱重新整理（HMR）。

3. **建置與預覽**

   ```bash
   npm run build   # 產生靜態檔案至 dist 目錄
   npm run preview # 預覽 build 後的結果
   ```

4. **格式化**

   ```bash
   npm run format       # 用 Prettier 自動排版
   npm run format:check # 只檢查、不修改，CI 會跑這個
   ```

5. **驗證**

   ```bash
   npm run check # Astro 型別與 JavaScript JSDoc 檢查
   npm run build # 正式靜態建置；此指令本身不執行型別檢查
   ```

   GitHub Actions 使用 Node 24，執行 `npm ci`、格式檢查、型別檢查與 build。專案保持簡單，不另維護自動化測試套件；頁面互動與視覺效果以瀏覽器手動確認。

### 套件配置與更新

Tailwind CSS 4 使用 `@tailwindcss/vite`，Typography 透過 CSS 的 `@plugin` 載入。字型使用 Astro 內建 Fonts API，Zod 從 `astro/zod` 匯入。HTML 解析器 `node-html-parser` 僅供 sitemap 建置使用，不會送到瀏覽器。

開發工具使用精確版本，安裝結果由 `package-lock.json` 鎖定。`@astrojs/check` 0.9.10 的 peer dependency 支援 TypeScript 5／6，因此目前固定使用 TypeScript 6.0.3；待官方支援 TypeScript 7 後再升級，不使用 `--force` 忽略相容性。

2026-09-30 更新至 Astro 7.3.5、Prettier 3.9.9、prettier-plugin-astro 1.1.0；其他直接相依套件已是 npm registry 當時的最新版。`npm audit fix` 同時將間接相依 `fast-uri` 更新至 3.1.8。Mermaid 的 Chevrotain 相依仍鎖定舊版 lodash-es，因此保留 `overrides`，統一使用修補版 4.18.1。上游解除舊版限制後，可重新評估移除 override，並再次執行 audit 與圖表驗證。

npm 的安裝腳本審核會對 `esbuild` 顯示警告；專案在 `package.json` 的 `allowScripts` 中僅核准已檢查的 `esbuild@0.28.2`。未來 esbuild 升版時，應先檢查新版腳本，再用 `npm install-scripts approve esbuild` 更新版本鎖定。

升級時同步更新 `package.json` 與 lockfile，再執行上述驗證，以及 `npm outdated`、`npm audit`。GitHub Actions 以完整 commit SHA 鎖定版本，更新時也需核對 release 與對應 SHA。

## 專案結構

```bash
src/
├── components/   # UI 元件 (PostCard, CategoryCard, TableOfContents)
├── content/      # 文章內容 (Content Collections)
│   └── posts/    # Markdown 檔案
├── integrations/ # sitemap 使用正式 HTML metadata 的建置整合
├── layouts/      # 頁面佈局 (BaseLayout)
├── pages/        # 頁面路由 (首頁, 文章內頁, 分類頁, RSS, 404)
├── scripts/      # 客戶端腳本 (TOC、Mermaid、背景方格光暈)
├── styles/       # 全域樣式與字型設定
└── utils/        # 工具函式與站台設定 (日期, 分類, 摘要, metadata)

public/
├── _headers      # Cloudflare Pages 的安全標頭與快取策略
├── images/posts/ # 文章內文圖片
├── robots.txt
├── favicon.svg
└── og-default.png

```

## 新增文章指南

文章直接放在 `src/content/posts`，每個 `.md` 檔案對應一篇文章，檔名即為網址 slug（請用全小寫英數與連字號）。目前 loader 僅讀取這一層的 Markdown，不支援巢狀文章目錄或 MDX。

### Frontmatter 格式

```markdown
---
title: 我的新文章標題
description: （選填）未填則擷取內文第一個非空行
date: 2026-01-27
updated: 2026-03-01 # （選填）內容有實質修訂時填寫，會反映在 sitemap 的 lastmod
category: learning # 必填，且只能是下表的六個值之一
cover: ../../assets/my-post-cover.png # （選填）社群分享圖片，填寫時必須有對應檔案
draft: false # （選填）設為 true 則不會發布
---

這裡開始撰寫正文內容...
```

完整的 schema 定義在 [`src/content.config.js`](src/content.config.js)。

### 分類一覽

`title`、`date`、`category` 都是必填。`category` 只能填以下六個 slug：

| slug             | 顯示名稱 | 說明                                       |
| ---------------- | -------- | ------------------------------------------ |
| `learning`       | 學習筆記 | 技術學習、課程回顧、技巧整理               |
| `tech-deep-dive` | 技術探索 | 深入原理、系統設計、效能優化               |
| `career`         | 職涯隨筆 | 工作經驗、遠端工作、職涯分享               |
| `project`        | 專案紀錄 | 開發過程、踩坑記錄、技術選型               |
| `web-basics`     | 網頁基礎 | 用生活化比喻，帶你搞懂網頁與網路的核心觀念 |
| `mindset`        | 心理     | 心理調適、軟實力與個人成長                 |

新增分類只需更新 [`src/utils/categories.js`](src/utils/categories.js) 的 `categories` 陣列，填入唯一的 slug、名稱、說明與圖示。內容 schema 與分類路由共用此定義；變更分類後也請同步更新上表。

### 撰寫建議

- **站內連結**：一律寫成帶尾斜線的 `/posts/<slug>/`。本站使用 Astro 的 `directory` 輸出格式，少了尾斜線會多一次 308 轉址。
- **圖片**：
  - 文章內文圖片放在 `public/images/posts/<slug>/`，在 Markdown 中以絕對路徑引用（例如 `/images/posts/my-post/photo.webp`）。這個路徑**不會**經過 Astro 的圖片優化管線，請自行先壓縮／轉檔（建議 WebP）再上傳，並在 `<img>` 上明確標註 `width`／`height`／`loading="lazy"` 以避免版面位移。
  - frontmatter 的 `cover` 欄位透過 Astro 的 `image()` schema 驗證並取得圖片 metadata，目前僅用於 Open Graph、Twitter Card 與 JSON-LD，不會顯示在文章頂端或卡片，也不會自動縮放／轉檔。請先壓縮圖片，再放在 `src/` 底下（例如自行建立 `src/assets/`）。路徑相對於**文章檔案本身**解析，因此從 `src/content/posts/foo.md` 指到 `src/assets/` 要寫 `../../assets/cover.png`。需要自動轉檔時，另行使用 Astro 的 `<Image />` 或 `getImage()`。
- **目錄**：文章內頁會自動解析 `h2` 與 `h3` 標題生成目錄。正文請從 `h2` 開始，`h1` 已由文章標題佔用。
- **Mermaid 圖表**：用 ` ```mermaid ` 圍欄即可，客戶端會自動轉譯。腳本在 `astro:page-load` 檢查頁面，只有存在圖表時才動態載入 Mermaid；套件內部也會按圖表類型載入額外模組。建置仍可能出現大型 chunk 警告，實際下載量與渲染成本取決於套件版本和圖表類型，需以瀏覽器 Network／Performance 實測。
- **表格**：表格一律包在 `<div class="table-wrapper" tabindex="0" role="group" aria-label="表格（可水平捲動）">` 裡。這不只是為了窄螢幕捲動——`.prose table` 的垂直間距刻意設為 `my-0`，由外層的 `.table-wrapper` 提供 `my-8` 與邊框、底色；沒包的話表格會緊貼上一段文字、也失去圓角邊框，而且 `≤768px` 的 `white-space: nowrap` 加上 `body` 的 `overflow-x: hidden` 會讓右側欄位在手機上被裁掉且無法捲到。`role` 用 `group` 而非 `region`：`region` 會讓每張表格都變成一個地標，一篇多表格的文章會塞爆螢幕閱讀器的地標清單。

## 部署

本專案為靜態輸出（Astro 預設的 `static` 模式），實際部署在 **Cloudflare Pages**。

```bash
npm run build
```

建置完成後，將 `dist` 資料夾內容上傳即可。

> **注意**：[`public/_headers`](public/_headers) 承載了整站的 CSP、HSTS 等安全標頭與 `/_astro/*` 的 immutable 快取策略。這是 Cloudflare Pages 與 Netlify 的專屬格式，**Vercel 不會讀取這個檔案**。若改用 Vercel，必須把內容改寫成 `vercel.json` 的 `headers` 設定，否則所有安全標頭與快取策略都會失效。

## 授權

- **程式碼**：MIT License
- **文章內容**（`src/content/` 與 `public/images/`）：[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant)

詳見 [LICENSE](LICENSE)。
