---
title: Figma to Code 工作流程分享
description: 解析從 Figma 設計稿轉化為 Vue + TypeScript + Tailwind 程式碼的高效工作流程，建立 Design System 以確保設計與開發的一致性。
date: 2023-06-20
updated: 2026-07-28
category: tech-deep-dive
---

切版時，我會先整理 Figma 裡的 Design System 和 User Flow，再用 Vue + TypeScript + Tailwind 把設計稿做成網頁。這樣比較容易讓元件、樣式和互動跟設計對得上，後續也能持續維護。

## 我常用的 Figma 功能

Figma 是業界常用的設計工具，對前端工程師來說，這幾個功能很方便：

1. **瀏覽器就能開**：不用裝軟體，收到連結就能看設計稿
2. **即時同步**：設計師改了什麼馬上就能看到
3. **Dev Mode**：專門給工程師看的模式，可以看到尺寸、間距、顏色等資訊
4. **匯出資源方便**：圖片、icon 可以直接匯出需要的格式和尺寸
5. **Design System 支援**：可以建立共用的 Component 和 Variable

## Design System 的建立與維護

把共用樣式和元件整理進 Design System，設計與開發就能用同一套規則。在 Figma 裡，我會確認這些內容：

### Color Styles

把專案用到的顏色都定義成 Color Styles，用有意義的命名：

- `primary/500`、`primary/600`：主色系
- `gray/100`、`gray/200`：中性色
- `success`、`error`、`warning`：語意色

這樣設計師和工程師都用同一套命名，溝通起來比較順。

### Typography Styles

字體樣式也要統一定義：

- `heading/h1`、`heading/h2`：標題層級
- `body/regular`、`body/small`：內文
- `caption`：輔助文字

每個 style 包含 font-family、font-size、line-height、font-weight、letter-spacing。

### Component Library

常用的 UI 元件做成 Figma Component：

- Button（各種 variant：primary、secondary、outline）
- Input、Select、Checkbox
- Card、Modal、Toast
- Navigation、Breadcrumb

用 Variant 功能來管理不同狀態（default、hover、disabled 等）。

### Spacing 和 Grid

間距規則用 4px 為基底的倍數系統比較好管理：4px、8px、16px、24px、32px...

Grid 系統定義好欄數和 gutter，方便對齊。

## User Flow 的規劃

User Flow 是用來描述使用者在網站上的操作路徑。在 Figma 裡面，我通常會這樣處理：

### 頁面關係圖

用 FigJam 或在 Figma 裡面畫出頁面之間的關係：

- 哪些頁面可以互相跳轉
- 主要的使用流程是什麼
- 有沒有需要登入才能看的頁面

### 狀態標註

每個頁面可能有多種狀態：

- 載入中
- 資料為空
- 有資料
- 錯誤狀態

這些都要標註清楚，工程師才知道每種情況要怎麼處理。

### 互動行為標註

Hover、Click 會發生什麼事，用註解標註：

- 這個按鈕點下去會跳到哪裡
- 表單送出後的反饋是什麼
- 動畫效果的細節

## 從 Figma 落地到 Vue + TypeScript + Tailwind

有了 Design System，接下來就是把它轉成程式碼。我習慣的技術組合是 Vue 3 + TypeScript + Tailwind CSS。

### 建立對應的 Tailwind Config

把 Figma 的 Design Token 轉成 Tailwind 的設定：

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          // primary 是全新的色票名稱，沒有預設值可繼承，用到哪一階就要定義哪一階；
          // 少定義 50，下面 outline 樣式的 hover:bg-primary-50 就不會生成任何 CSS。
          // （在 extend 底下擴充「既有」色票如下面的 gray 則是深層合併，
          //   預設的 gray-300~900 仍然可用，所以後面才能寫 text-gray-800。）
          50: "#EFF6FF",
          500: "#2563EB",
          600: "#1D4ED8",
        },
        gray: {
          100: "#F3F4F6",
          200: "#E5E7EB",
        },
      },
      fontSize: {
        "heading-h1": ["2.25rem", { lineHeight: "2.5rem", fontWeight: "700" }],
        "heading-h2": ["1.5rem", { lineHeight: "2rem", fontWeight: "600" }],
        "body-regular": ["1rem", { lineHeight: "1.5rem" }],
      },
      spacing: {
        18: "4.5rem",
      },
    },
  },
};
```

這樣 Tailwind 的 class 和 Figma 的 Design Token 就能對應起來。

色票也要和使用情境一起確認。這裡的 primary 按鈕用白字配 `#2563EB`，文字對比約 5.17:1，符合一般文字的 WCAG AA 4.5:1 門檻；hover 的 `#1D4ED8` 更深。較亮的藍色仍可用在裝飾上，但若是小字按鈕，不能只看設計稿覺得顏色好看。可用[文字對比要求](https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html)檢查正常、hover 與其他狀態。

> **後記（2026 更新）**：上面是 Tailwind v3 的寫法。v4 起改用 CSS 端的 `@theme` 區塊定義變數，不再需要 `tailwind.config.js`（舊檔仍可透過 `@config` 沿用）。同一套 Design Token 在 v4 的寫法可以參考〈[Tailwind CSS v4 升級指南](/posts/tailwind-v4-upgrade/)〉。

### 建立 TypeScript 元件

把 Figma 的 Component 轉成 Vue 元件，用 TypeScript 定義好 props：

```vue
<!-- components/Button.vue -->
<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  disabled: false,
});

const buttonClasses = computed(() => {
  const base = "font-medium rounded-lg transition-colors";

  const variants = {
    primary: "bg-primary-500 text-white hover:bg-primary-600",
    secondary: "bg-gray-100 text-gray-800 hover:bg-gray-200",
    outline: "border border-primary-500 text-primary-500 hover:bg-primary-50",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-base",
    lg: "px-6 py-3 text-lg",
  };

  return [base, variants[props.variant], sizes[props.size]];
});
</script>

<template>
  <button :class="buttonClasses" :disabled="props.disabled">
    <slot />
  </button>
</template>
```

TypeScript 會在型別檢查時提醒 variant 和 size 是否符合定義。不過，API 或使用者輸入的資料仍需要執行時驗證，型別宣告本身不會擋下錯誤資料。

### 元件文件化

每個元件的使用方式要記錄下來，可以用 Storybook 或簡單的 Markdown 文件。記錄：

- 支援哪些 props
- 每個 variant 長什麼樣子
- 使用範例

這樣團隊其他人也能正確使用這些元件。

## 確保一致性的做法

### 命名對齊

Figma 的 Component 名稱和程式碼的元件名稱保持一致，例如 Figma 端是 `Button/Primary/Large`，程式碼端就對應寫成 `<Button variant="primary" size="lg" />`，這樣溝通時不會搞混。

### 定期同步

Design System 會不斷更新，要有機制讓設計和程式碼保持同步：

1. 設計師更新 Figma 的 Component
2. 通知工程師有什麼改動
3. 工程師更新對應的程式碼
4. 最後再更新文件，確保兩邊不會脫節

### Code Review 檢查

Code Review 時確認新做的 UI 有使用共用元件，不是自己從頭寫。如果有新的樣式需求，討論是不是應該加到 Design System 裡面。

## Figma 常用操作技巧

### Dev Mode 怎麼用

Figma 的 Dev Mode 是專門給工程師的檢視模式。切換到 Dev Mode 後，點選任何元素都可以看到：

- 尺寸（寬、高）
- 間距（padding、margin）
- 顏色值
- 字體資訊
- CSS 屬性（雖然不一定直接能用，但可以參考）

如果設計師有用 Auto Layout，還可以看到 Flexbox 的設定。

### 取得準確的尺寸

選取元素後，右側面板會顯示尺寸資訊。要注意的是：

- 固定尺寸還是彈性尺寸
- 最大寬度、最小寬度有沒有定義
- 間距是固定值還是要自適應

### 匯出圖片資源

在 Figma 裡面，選取要匯出的元素，在右側 Export 區塊可以設定：

- 格式（PNG、JPG、SVG、PDF）
- 倍率（1x、2x、3x）
- 尺寸

Icon 通常用 SVG，照片可以匯出成 JPG 或 PNG，再視需要轉成 WebP。如果需要響應式圖片，可以準備多個尺寸。

## 實務上的經驗

### Mobile First

如果是手機使用者較多的網站，我通常先看手機版設計，完成小螢幕的版面，再用 Media Query 往大螢幕擴展。後台或桌面操作為主的產品，則會依主要使用情境安排。

### 先做結構再做樣式

我的習慣是先把 HTML 結構寫出來，確認架構正確，再來處理 CSS。不要一邊寫結構一邊調樣式，這樣很容易改來改去。

### 和設計師協作

建立共同語言很重要。跟設計師溝通的時候，用一些雙方都懂的詞彙：Padding、Margin、Flexbox、Hover 狀態、Breakpoint。

定期同步進度，不要等到全部做完才給設計師看。做完一個區塊就先同步，有問題可以早點發現早點改。

有些設計效果做起來成本很高，或是瀏覽器支援度不好。遇到這種情況要主動跟設計師討論，找出可行的替代方案。

## 結語

我會把 Figma 的樣式與元件對應到程式碼裡，搭配 TypeScript 的型別檢查和 Tailwind 的 utility class，讓設計調整時比較容易同步修改。

實作過程也要持續和設計師溝通，熟悉 Figma 操作，尤其要確認互動狀態與成本較高的效果，讓設計與開發比較容易銜接。

---

站內相關文章：

- [藝術銀行 Art Bank 開發紀錄](/posts/artbank-nuxt3-ssr-development/)
- [從 Vue 跳到 React 的開發心得](/posts/vue-to-react-transition/)
