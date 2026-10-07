---
title: 用 CSS 隱藏網頁元素的六種方法 — 完整比較與無障礙考量
description: display:none、visibility:hidden 差在哪？整理 6 種 CSS 隱藏元素的方法，深入比較其特性與無障礙（Accessibility）影響。
date: 2024-04-20
updated: 2026-07-28
category: learning
---

隱藏頁面元素時，除了讓它看不見，還要考慮是否保留空間、是否讓螢幕閱讀器讀取，以及是否需要動畫。這些需求會影響 CSS 寫法的選擇。

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
- 單靠上面的寫法，不會產生漸變動畫；新版 CSS 可以搭配離散轉場和起始樣式處理顯示／隱藏，需另外確認瀏覽器支援

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
- 在 Flexbox 子項目：規範定義為隱藏且不佔用主軸空間，但瀏覽器實作可能不完整，有些仍會保留空間。正式環境使用前，請實測目標瀏覽器的排版結果
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

如果要避免透明元素被滑鼠點擊，可以搭配 `pointer-events: none;`。但它不會取消 Tab 聚焦，也不會把內容從螢幕閱讀器中移除：

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

這是常見的視覺隱藏模式。Tailwind CSS 提供 `sr-only` utility；Bootstrap 5+ 稱為 `.visually-hidden`（Bootstrap 4 稱為 `.sr-only`）。各版本實作不完全相同，可能使用 `clip-path` 或較舊的 `clip: rect(...)`，要以實際載入的版本為準。

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

這張表以單獨使用上述基本寫法為準；顯示／隱藏的離散轉場需要額外設定。移出螢幕的元素沒有消失，仍可能接受程式操作或鍵盤聚焦。

＊`visibility: collapse` 的空間處理依元素類型與瀏覽器而異。規範要求 table 列／欄收合後移除對應空間，但跨列儲存格與部分瀏覽器實作仍可能有差異，不能一概保證版面結果。Flex 的主軸收合也要確認瀏覽器支援；Grid 則按 `visibility: hidden` 處理。可對照 [MDN 的實作注意事項](https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/visibility#notes)，並測試實際表格內容。

## 無障礙（Accessibility）考量

選擇隱藏方式時，一定要考慮無障礙需求：

### 情境一：完全隱藏，所有人都看不到

使用 `display: none` 或 `visibility: hidden`。

### 情境二：視覺隱藏，但螢幕閱讀器可讀

使用 `.sr-only` 類別（Position 移出螢幕的改良版）。這在以下情況很常見：

- 圖示按鈕的文字標籤（視覺上只顯示圖示，但螢幕閱讀器需要念出按鈕功能）
- 跳轉連結（Skip to main content）
- 表單欄位的額外說明

如果是讓鍵盤使用者跳到主內容的連結，還要加上「取得焦點時顯示」的樣式，讓使用者知道自己目前選到了哪個連結。

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

選擇寫法前，先確認：

1. 這個元素需要被螢幕閱讀器讀到嗎？
2. 需要保留空間嗎？
3. 需要動畫效果嗎？

確認這些需求後，就可以對照上面的表格選擇寫法。

---

- [visibility - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/visibility)
- [display - MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/display)
- [Inclusively Hidden - Scott O'Hara](https://www.scottohara.me/blog/2017/04/14/inclusively-hidden.html)

---

站內相關文章：

- [HTML 與 CSS 入門 — 用 Word 文件來比喻網頁的結構與樣式](/posts/html-css-basics-explained-with-word/)
