# 個人部落格

線上網址：<https://blog.worksbyaaron.com>

Astro 7 + Tailwind CSS 4 靜態部落格，文章以 Markdown 管理。支援分類、閱讀時間、文章目錄、Mermaid、RSS、Sitemap，以及 Open Graph、Twitter Card 和 JSON-LD。

工具與客戶端腳本使用 JavaScript + JSDoc，部分 `.astro` 元件使用 TypeScript 宣告 Props 型別。

## 開發

需要 Node.js 22.12 以上、npm 10 以上；建議使用與 CI 相同的 Node.js 24。

```bash
npm ci
npm run dev
```

開發網址預設為 `http://localhost:4321`。

| 指令                   | 用途                                   |
| ---------------------- | -------------------------------------- |
| `npm run build`        | 產生靜態網站至 `dist/`，不包含型別檢查 |
| `npm run preview`      | 預覽建置結果                           |
| `npm run check`        | Astro 型別與 JavaScript JSDoc 檢查     |
| `npm run format`       | 使用 Prettier 格式化                   |
| `npm run format:check` | 檢查格式，不修改檔案                   |

GitHub Actions 在 `main` 的 push 與 pull request 執行 `npm ci`、格式檢查、型別檢查與建置。目前沒有自動化測試套件，互動與視覺需用瀏覽器確認。

## 專案結構

```text
src/
├── content.config.js # 文章 schema 與 loader
├── content/posts/    # Markdown 文章
├── components/       # 卡片、文章目錄
├── layouts/          # 共用佈局與頁面 metadata
├── pages/            # 首頁、文章、分類、RSS、404
├── integrations/     # 從建置後 HTML 取得 sitemap metadata
├── scripts/          # TOC、Mermaid、背景光暈
├── styles/           # 全域樣式、字型、Typography
└── utils/            # 站台設定、分類、日期、摘要
public/               # 圖片、favicon、robots.txt、部署標頭
```

站台網址設定在 [`astro.config.mjs`](astro.config.mjs)，名稱、作者與預設分享圖片設定在 [`src/utils/site.js`](src/utils/site.js)。

## 新增文章

在 `src/content/posts/` 新增 `.md` 檔案，檔名使用小寫英數與連字號。`my-post.md` 對應 `/posts/my-post/`。Loader 僅讀取這一層的 Markdown，不支援巢狀目錄或 MDX。

```markdown
---
title: 我的新文章
date: 2026-10-02
category: learning
---

正文從這裡開始。
```

`title`、`date`、`category` 必填，其他欄位如下。完整定義見 [`src/content.config.js`](src/content.config.js)。

| 選填欄位      | 用途                                                          |
| ------------- | ------------------------------------------------------------- |
| `description` | 摘要；未填時擷取正文第一個非空行，轉為純文字                  |
| `updated`     | 實質修訂日期，用於頁面更新時間、metadata 與 sitemap `lastmod` |
| `cover`       | 分享圖片；路徑相對於文章檔案，需有對應圖片                    |
| `draft`       | 預設 `false`；設為 `true` 時不發布，也不列入 RSS 與 Sitemap   |

### 分類

| slug             | 名稱     |
| ---------------- | -------- |
| `learning`       | 學習筆記 |
| `tech-deep-dive` | 技術探索 |
| `career`         | 職涯隨筆 |
| `project`        | 專案紀錄 |
| `web-basics`     | 網頁基礎 |
| `mindset`        | 心理     |

新增分類時，更新 [`src/utils/categories.js`](src/utils/categories.js) 的 slug、名稱、說明與圖示，並同步上表。Schema 與分類路由共用這份定義。少於 2 篇文章的分類頁會設為 `noindex`，並排除於 Sitemap。

### 內容格式

- 正文從 `h2` 開始；文章標題使用 `h1`，目錄收錄 `h2`、`h3`。
- 站內文章連結使用帶尾斜線的 `/posts/<slug>/`，與 canonical、RSS 和 Sitemap 一致。
- Mermaid 使用 ` ```mermaid ` 圍欄；頁面有圖表時才載入並渲染。
- 表格包在 `<div class="table-wrapper" tabindex="0" role="group" aria-label="表格（可水平捲動）">` 中，提供水平捲動、鍵盤操作與樣式。
- 內文圖片放在 `public/images/posts/<slug>/`，以 `/images/posts/<slug>/photo.webp` 引用。請先壓縮，並為 `<img>` 加上 `width`、`height`、`loading="lazy"`；這些圖片不會自動優化。
- `cover` 只用於 Open Graph、Twitter Card 與 JSON-LD，不顯示在文章頂端或卡片。可自行建立 `src/assets/` 放圖片，欄位填 `../../assets/cover.webp`。Schema 會取得圖片 metadata，不會自動縮放或轉檔。

## 字型與套件維護

Inter、Outfit、JetBrains Mono 透過 Astro Fonts API 在建置時下載並自架；首次建置需連線 Google Fonts。Noto Sans TC 使用外部 Google Fonts，讀者端無法載入時會回退系統字型。

Tailwind 使用 `@tailwindcss/vite`，Typography 由 CSS 的 `@plugin` 載入。`node-html-parser` 只用於 sitemap 建置。

套件版本以 `package.json` 與 `package-lock.json` 為準。升級時同步更新兩者，確認 `@astrojs/check` 與 TypeScript 相容，再執行格式檢查、型別檢查、建置、`npm outdated` 與 `npm audit`。

維護時留意：

- `overrides` 的 `lodash-es` 用來修補 Mermaid 間接相依；移除前確認上游已解除限制，並重新執行 audit 與圖表驗證。
- `allowScripts` 僅核准指定版本的 `esbuild` 安裝腳本；升版時先審核新版腳本，再更新核准版本。
- GitHub Actions 使用完整 commit SHA；更新時核對 release 與 SHA。

## 部署

Cloudflare Pages 的建置指令為 `npm run build`，輸出目錄為 `dist/`；也可將本機建置結果上傳。

[`public/_headers`](public/_headers) 設定安全標頭與靜態資源快取。改用其他部署平台時，需確認是否支援這個格式；例如 Vercel 必須改寫為 `vercel.json` 的 `headers` 設定。

## 授權

程式碼採 MIT；`src/content/` 與 `public/images/` 採 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant)。詳見 [LICENSE](LICENSE)。
