---
title: Tailwind CSS v4 升級指南 — 速度更快、體積更小、寫法更自由
description: v4 推出一年後的升級重點整理：設定從 JS 檔改成在 CSS 的 @theme 裡定義變數，舊的 tailwind.config.js 仍可透過 @config 沿用。
date: 2026-02-19
updated: 2026-07-28
category: learning
---

Tailwind CSS v4 重新設計了 CSS 引擎，保留 Utility-First 的使用方式，也調整了配置方式與建置效能。

v4.0 在 2025 年 1 月正式發布。推出一年、生態系與周邊工具跟上之後，我回頭整理了升級重點，著重在實際搬遷時容易卡住的地方。

## 最大的改變：速度與體積

v4 把預設的配置方式從 JavaScript 設定檔換成了 CSS 變數。舊的 `tailwind.config.js` 仍可透過 `@config` 指令沿用，但新專案可以直接在 CSS 裡用 `@theme` 設定。

1. **編譯速度大幅提升**：官方實測顯示，完整建置最高可提升約 5 倍，而未新增樣式時的增量建置更可達 100 倍以上、以微秒計算。這主要來自全新以 Rust 打造、內建 Lightning CSS 的引擎，而不只是省去 JS 設定檔解析。
2. **更小的打包體積**：只打包用到的樣式，這是 JIT 模式從 v3 就有的特性；v4 則進一步改善效能與架構。

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
`p-*`／`m-*`／`gap-*`。要設定 `font-sans`，變數名稱是 `--font-sans`。
如果誤寫成 `--font-family-sans`，對應的 class 會變成 `font-family-sans`，
不會改到原本想設定的 `font-sans`。可以對照[官方命名空間表](https://tailwindcss.com/docs/theme#theme-variable-namespaces)確認名稱。

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

這類旋轉可以直接用 class 組合，也仍能按需求自己寫 `transform: rotateX(...)`。

## 升級指南

如果專案還在用 v3，先確認目標瀏覽器是否符合 v4 的要求：Safari 16.4、Chrome 111、Firefox 128 以上。需要支援更舊的瀏覽器時，可以先留在 v3.4。

官方遷移工具需要 Node.js 20 以上。建議在獨立分支執行，方便檢查變更：

```bash
npx @tailwindcss/upgrade
```

工具會協助更新依賴、搬移設定與調整模板，但執行完還要看 diff、建置專案，並打開實際頁面確認。尤其要留意 border 的預設顏色、ring 的寬度，以及 shadow、rounded 等 utility 的命名調整；程式沒有報錯，畫面也可能和 v3 不同。

PostCSS 與 CLI 的整合套件也有變動，不能只轉換 `tailwind.config.js` 就算完成。遷移時可以逐項對照[官方升級指南](https://tailwindcss.com/docs/upgrade-guide)。

## 結語

對我來說，把設定放進 CSS，是 v4 最有感的改變。新專案可以直接從 `@theme` 開始；既有專案則先確認瀏覽器支援範圍，再用遷移工具處理大部分修改，把時間留給畫面與互動的檢查。

---

站內相關文章：

- [現代 CSS 功能](/posts/modern-css-features/)
- [Figma to Code 工作流](/posts/figma-to-code-workflow/)
