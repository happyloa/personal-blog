# 個人部落格

線上網址：<https://blog.worksbyaaron.com>

Astro + Tailwind CSS 靜態部落格，部署於 Cloudflare Pages。以 Markdown 管理文章，支援分類、目錄、閱讀進度、Mermaid、RSS 與 Sitemap。

## 開發

使用 [`.node-version`](.node-version) 指定的 Node.js 24 與 npm。

```bash
npm ci
npm run dev
```

開發網址為 `http://localhost:4321`。

| 指令                        | 用途                               |
| --------------------------- | ---------------------------------- |
| `npm run build`             | 建置靜態網站至 `dist/`             |
| `npm run preview`           | 預覽建置結果                       |
| `npm run check`             | 檢查 Astro 型別與 JavaScript JSDoc |
| `npm run format:check`      | 檢查格式                           |
| `npm run format`            | 格式化檔案                         |
| `npm run test:dependencies` | 執行小型依賴安全回歸測試           |

CI 執行 `npm ci`、格式與型別檢查、依賴測試、建置及 `npm audit`。安全修補 overrides 與依賴測試一起維護。TypeScript 維持 6.x，待 `@astrojs/check` 的 peer dependency 支援 7.x 後再升級。

## 新增文章

在 `src/content/posts/` 新增 `.md`，檔名 `my-post.md` 對應 `/posts/my-post/`。

```markdown
---
title: 我的新文章
date: 2026-10-02
category: learning
---

## 第一個段落

正文從這裡開始。
```

`title`、`date`、`category` 必填；可選欄位為 `description`、`updated`、`cover`、`draft`。`updated` 記錄實質修訂日期，`cover` 用於分享圖片，`draft: true` 的文章不公開。完整定義見 [`src/content.config.js`](src/content.config.js)。

分類定義在 [`src/utils/categories.js`](src/utils/categories.js)：

| slug             | 分類     |
| ---------------- | -------- |
| `learning`       | 學習筆記 |
| `tech-deep-dive` | 技術探索 |
| `career`         | 職涯隨筆 |
| `project`        | 專案紀錄 |
| `web-basics`     | 網頁基礎 |
| `mindset`        | 心理     |

正文從 `h2` 開始，目錄收錄 `h2`、`h3`。圖表使用 `mermaid` 程式碼圍欄；寬表格包在 `<div class="table-wrapper" tabindex="0" role="group" aria-label="表格（可水平捲動）">` 中。

文章內圖片放在 `public/images/posts/<slug>/`，使用 `/images/posts/<slug>/photo.webp` 引用，並填寫 `width`、`height` 與適合的載入屬性。

首頁顯示最新 6 篇，`/posts/` 每頁 12 篇。少於 2 篇的分類頁設為 `noindex`。

## 設定與部署

站台網址位於 [`astro.config.mjs`](astro.config.mjs)，名稱、作者與預設分享圖片位於 [`src/utils/site.js`](src/utils/site.js)。

拉丁字型由 Astro Fonts API 在建置時下載並自架，因此首次建置需要網路；中文字型由瀏覽器載入 Google Fonts。

Cloudflare Pages 使用 `npm run build`，輸出目錄為 `dist/`。安全標頭與快取設定見 [`public/_headers`](public/_headers)。

## 授權

程式碼採 MIT；`src/content/` 與 `public/images/` 採 [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/deed.zh-hant)。詳見 [LICENSE](LICENSE)。
