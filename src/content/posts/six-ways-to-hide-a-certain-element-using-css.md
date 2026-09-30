---
title: 用 CSS 隱藏網頁元素的六種方法 — 完整比較與無障礙考量
description: display:none、visibility:hidden 差在哪？整理 6 種 CSS 隱藏元素的方法，深入比較其特性與無障礙（Accessibility）影響。
date: 2024-04-20
updated: 2026-07-28
category: learning
---

想要隱藏頁面上的元素，有很多種方法可以選擇。不同的方法會有不同的特性，選擇哪一種取決於你的需求：元素是否要佔據空間？是否需要被螢幕閱讀器讀取？是否需要有動畫效果？

這篇文章整理了六種常見的 CSS 隱藏方法，並說明各自的適用場景和無障礙（Accessibility）考量。

## 1. display: none — 完全從文件流移除

```css
.hidden {
  display: none;
}
```

這是最常見也最徹底的隱藏方式。

**特性：**

- 元素完全從文件流中移除
- 不佔據任何空間
- **無法被螢幕閱讀器讀取**
- 無法被 Tab 鍵聚焦
- 無法套用 CSS transition 動畫

**適用場景：** 需要完全隱藏某個區塊，例如 Tab 切換時隱藏非當前的內容、手機版隱藏桌面版專用的元素。

## 2. visibility: hidden — 保留空間但視覺隱藏

```css
.invisible {
  visibility: hidden;
}
```

讓元素「看不見」，但空間還在。

**特性：**

- 元素視覺上消失
- **佔據原本的空間**（會留下空白區域）
- 無法被螢幕閱讀器讀取
- 無法被 Tab 鍵聚焦
- 可以套用 CSS transition 動畫
- 子元素可以設定 `visibility: visible` 來單獨顯示

**適用場景：** 需要保留佈局空間的情況，例如等待載入時的佔位元素。

## 3. visibility: collapse — 表格／Flex 專用的收合

```css
.collapsed {
  visibility: collapse;
}
```

這個屬性根據元素類型有不同的行為。

**特性：**

- 在 `<table>` 的列（`<tr>`）或欄（`<col>`）：規範定義為隱藏且不佔空間
- 在 Flexbox 子項目：規範定義為隱藏且不佔用主軸空間，但**目前僅 Firefox 完整實作**；Chrome/Edge（Chromium）與 Safari 大多仍把它當成 `visibility: hidden` 處理（仍會佔據空間），正式環境使用前請先實測目標瀏覽器
- 在 Grid 子項目：**規範並未給予特例**，等同於 `visibility: hidden`，仍會佔據原本的空間
- 在其他元素：等同於 `visibility: hidden`

**適用場景：** 動態顯示/隱藏表格的列或欄；若想用於 Flex 項目的切換，記得先確認目標瀏覽器是否支援「不佔空間」的行為，否則建議當成 `visibility: hidden` 的等效寫法使用。

## 4. opacity: 0 — 完全透明

```css
.transparent {
  opacity: 0;
}
```

讓元素完全透明。

**特性：**

- 元素視覺上完全透明
- **佔據原本的空間**
- **仍然可以被點擊和互動**
- 仍然可以被 Tab 鍵聚焦
- **螢幕閱讀器可以讀取**
- 可以套用 CSS transition 動畫（常用於淡入淡出效果）

**適用場景：** 需要動畫效果的顯示/隱藏，例如 hover 時的淡入效果、Toast 通知的淡出動畫。

**注意：** 如果不想讓透明元素被互動，需要搭配 `pointer-events: none;`：

```css
.transparent-no-interaction {
  opacity: 0;
  pointer-events: none;
}
```

## 5. 移出可視範圍（position: absolute）

```css
.offscreen {
  position: absolute;
  left: -9999px;
}
```

把元素移到螢幕外。

**特性：**

- 視覺上看不見（因為在畫面外）
- 元素脫離文件流（因為是 absolute），不會影響其他元素的佈局位置
- **螢幕閱讀器可以讀取**
- 仍然可以被 Tab 鍵聚焦

**適用場景：** 這是 **無障礙友善** 的隱藏方式，適合用於「只給螢幕閱讀器看」的內容，例如跳轉連結（Skip Link）、表單的輔助說明文字。

**改良版寫法（更安全）：**

```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
  border: 0;
}
```

這是 Tailwind CSS（`sr-only` utility）目前使用的寫法；Bootstrap 5+ 稱為 `.visually-hidden`（Bootstrap 4 稱為 `.sr-only`），兩者現行版本都已改用 `clip-path` 而非較舊的 `clip: rect(...)`。

## 6. clip-path — 裁切成不可見

```css
.clipped {
  clip-path: inset(50%);
}
```

使用 `clip-path` 裁切元素。

**特性：**

- 元素被裁切成不可見
- 佔據原本的空間
- 無法被點擊（被裁切的區域不會觸發事件）
- 螢幕閱讀器可以讀取
- 仍然可以被 Tab 鍵聚焦
- 可以套用 CSS transition 動畫

**適用場景：** 需要特殊裁切動畫效果時使用。

## 比較表格

<div class="table-wrapper" tabindex="0" role="group" aria-label="表格（可水平捲動）">

| 方法                    | 佔據空間 | 可點擊 | 螢幕閱讀器 | 可 Tab 聚焦 | 可動畫 |
| ----------------------- | :------: | :----: | :--------: | :---------: | :----: |
| `display: none`         |    ❌    |   ❌   |     ❌     |     ❌      |   ❌   |
| `visibility: hidden`    |    ✅    |   ❌   |     ❌     |     ❌      |   ✅   |
| `visibility: collapse`  | 看情況＊ |   ❌   |     ❌     |     ❌      |   ✅   |
| `opacity: 0`            |    ✅    |   ✅   |     ✅     |     ✅      |   ✅   |
| Position 移出螢幕       |    ❌    |   ❌   |     ✅     |     ✅      |   ❌   |
| `clip-path: inset(50%)` |    ✅    |   ❌   |     ✅     |     ✅      |   ✅   |

</div>

＊`visibility: collapse` 是否「不佔空間」依元素類型與瀏覽器而異：table 列/欄一律不佔空間；Flex 項目僅 Firefox 完整支援，Chrome/Edge/Safari 大多仍佔據空間；Grid 子項目則一律等同 `visibility: hidden`，仍佔據空間（詳見上方第 3 節說明）。

## 無障礙（Accessibility）考量

選擇隱藏方式時，一定要考慮無障礙需求：

### 情境一：完全隱藏，所有人都看不到

使用 `display: none` 或 `visibility: hidden`。

### 情境二：視覺隱藏，但螢幕閱讀器可讀

使用 `.sr-only` 類別（Position 移出螢幕的改良版）。這在以下情況很常見：

- 圖示按鈕的文字標籤（視覺上只顯示圖示，但螢幕閱讀器需要念出按鈕功能）
- 跳轉連結（Skip to main content）
- 表單欄位的額外說明

```html
<button>
  <svg><!-- 圖示 --></svg>
  <span class="sr-only">關閉選單</span>
</button>
```

### 情境三：需要動畫效果

使用 `opacity` 搭配 `pointer-events` 和 `visibility`：

```css
.fade-hidden {
  opacity: 0;
  visibility: hidden;
  pointer-events: none;
  transition:
    opacity 0.3s,
    visibility 0.3s;
}

.fade-visible {
  opacity: 1;
  visibility: visible;
  pointer-events: auto;
}
```

這樣可以有淡入淡出效果，又不會讓隱藏的元素被意外互動。

## 結語

隱藏元素看起來是很簡單的事，但背後有很多細節需要考慮。選擇正確的隱藏方式，可以讓網站有更好的使用者體驗，也能照顧到使用輔助科技的使用者。

下次要隱藏元素時，先想一想：

1. 這個元素需要被螢幕閱讀器讀到嗎？
2. 需要保留空間嗎？
3. 需要動畫效果嗎？

根據這些問題，選擇最適合的隱藏方式。

---

- [visibility - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility)
- [display - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/display)
- [Inclusively Hidden - Scott O'Hara](https://www.scottohara.me/blog/2017/04/14/inclusively-hidden.html)

---

站內相關文章：

- [HTML 與 CSS 入門 — 用 Word 文件來比喻網頁的結構與樣式](/posts/html-css-basics-explained-with-word/)
