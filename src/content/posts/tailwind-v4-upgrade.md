---
title: Tailwind CSS v4 升級指南 — 速度更快、體積更小、寫法更自由
description: v4 推出一年後的升級重點整理：設定從 JS 檔改成在 CSS 的 @theme 裡定義變數，舊的 tailwind.config.js 仍可透過 @config 沿用。
date: 2026-02-19
updated: 2026-07-28
category: learning
---

Tailwind CSS v4 是近年來最大的版本更新。它不再只是「好用的 Utility-First CSS」，而是一個經過重新設計的 CSS 引擎。

v4.0 在 2025 年 1 月正式發布，這篇是我在它推出一年、生態系與周邊工具都跟上之後，回頭整理的升級重點——比起剛發布時的功能速覽，這裡更著重在實際搬遷時真正會卡住的地方。

## 最大的改變：速度與體積

v4 把預設的配置方式從 JavaScript 設定檔換成了 **CSS 變數**（舊的 `tailwind.config.js` 仍可透過 `@config` 指令沿用，但官方建議直接改用 CSS 端的 `@theme`）。這次改版最有感的地方是：

1. **編譯速度大幅提升**：官方實測顯示，完整建置最高可提升約 5 倍，而未新增樣式時的增量建置更可達 100 倍以上、以微秒計算。這主要來自全新以 Rust 打造、內建 Lightning CSS 的引擎，而不只是省去 JS 設定檔解析。
2. **更小的打包體積**：只打包你真正用到的樣式——這其實是 JIT 模式從 v3 就有的特性，v4 則是在效能與架構上做了大幅升級。

## 全新的配置方式

以前我們要定義顏色、斷點，都要去 `tailwind.config.js` 改。現在，直接在 CSS 檔裡用 `@theme` 區塊定義：

```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #ff5722;
  --font-sans: "Inter", sans-serif;
  --spacing-128: 32rem;
}
```

然後你就可以直接用 `text-brand-primary`、`font-sans` 或 `p-128`。

這裡的變數前綴不能亂取，它決定了會生成哪一組 utility：`--color-*` 對應
`text-*`／`bg-*`／`border-*`，`--font-*` 對應 `font-*`，`--spacing-*` 對應
`p-*`／`m-*`／`gap-*`。寫成 `--font-family-sans` 這種不存在的命名空間不會報錯，
但也不會生成任何 utility，是很容易踩到的坑。

## 任意值語法與 CSS 運算

其實方括號任意值語法（例如 `w-[350px]`）與其中的 **CSS 運算**（`calc()`），從 v3 的 JIT 引擎就開始支援了；v4 帶來的新意在於引擎效能更好，處理這些任意值時更快、更省資源。

```html
<div class="w-[calc(100%-20px)] bg-brand-primary/50">...</div>
```

注意那個 `/50`：v4 底層改用 `color-mix()` 處理透明度，因此即使顏色是用 CSS 變數表示，`/50` 這類修飾語也能正常運作，不再需要額外的 hack。

## 容器查詢（Container Queries）正式轉正

以前要用 `@tailwindcss/container-queries` 外掛，現在直接內建：

```html
<div class="@container">
  <div class="@lg:grid-cols-2 grid">
    <!-- 當父容器大於 lg 時變兩欄 -->
  </div>
</div>
```

## 3D 變換（3D Transforms）

v4 增加了對 3D 屬性的支援：

```html
<div class="transform-3d rotate-x-12 rotate-y-24">...</div>
```

再也不用自己寫 `transform: rotateX(...)` 了。

## 升級指南

如果你還在用 v3，升級其實很無痛。官方提供了一個遷移工具：

```bash
npx @tailwindcss/upgrade
```

它會自動幫你把 `tailwind.config.js` 的設定轉換成新的 CSS 變數格式。

## 結語

說真的，Tailwind v4 這次大改版真的超有感！寫起來有種直接寫原生 CSS 的痛快感，但又保留了套 class 的爽度。如果你之前一直猶豫要不要學 Tailwind，別等了，現在絕對是上車的最佳時機！

---

站內相關文章：

- [現代 CSS 功能](/posts/modern-css-features/)
- [Figma to Code 工作流](/posts/figma-to-code-workflow/)
