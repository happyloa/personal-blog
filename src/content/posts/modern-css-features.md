---
title: 你可能還不知道的現代 CSS 功能 — Nesting、:has() 與 @container
description: 用卡片與表單的例子，認識原生 CSS Nesting、:has() 與尺寸容器查詢，也留意它們和 SCSS、Media Query 的差別。
date: 2026-02-18
category: learning
---

CSS 這幾年新增了不少實用功能，有些寫法以前得靠 SASS/SCSS，現在原生 CSS 就能處理。以下整理三個我覺得值得認識的功能。

## 1. 原生巢狀（Nesting）

以前常透過 SCSS 使用這種巢狀寫法：

```scss
/* SCSS */
.card {
  background: white;

  .title {
    color: black;
  }
}
```

現在原生 CSS 也支援巢狀規則，不過不代表 SCSS 的所有語法都能原封不動搬過去：

```css
/* Native CSS */
.card {
  background: white;

  & .title {
    color: black;
  }

  &:hover {
    background: #f0f0f0;
  }
}
```

它不需要編譯器，瀏覽器可以直接解析，也能減少重複寫 selector，讓樣式的層次比較清楚。

## 2. 父層選擇器 :has()

過去我們可以從父層選取子層（Parent > Child），卻無法反過來依子層條件選取父層（Child < Parent）。

`:has()` 讓你終於可以說：「如果這個卡片裡面有圖片，就讓卡片自動變成左右兩欄的 grid 版面」。

```css
/* 如果 .card 裡面包含 .image，就讓 .card 變成 grid layout */
.card:has(.image) {
  display: grid;
  grid-template-columns: 1fr 1fr;
}

/* HTML: <input id="x"><label for="x">...</label> */
/* 如果 input 被勾選了，就把緊接在後面的 label 變紅色 */
input:checked + label {
  color: red;
}

/* HTML: <label>...</label><input id="x">（label 在前、input 在後時）*/
/* :has() 讓我們終於能「往前選取」：根據後面兄弟元素的狀態，反過來選取前面的元素 */
label:has(+ input:checked) {
  color: red;
}
```

它也能依照條件選取元素，用途不限於選取父層。

## 3. 容器查詢（Container Queries）

做 RWD（響應式設計）時，常會用視窗寬度（Viewport Width）設定斷點，例如 `@media (max-width: 768px)`。Media Query 也能查詢其他裝置條件，這裡先看寬度。

但這有個問題：一個卡片元件，放在側邊欄（窄）和放在主內容區（寬），我們希望它長得不一樣。但 `@media` 不知道卡片現在在多寬的容器裡。

尺寸容器查詢可以依符合條件的祖先容器調整樣式，不一定是緊鄰的父元素。下面先用 `container-type: inline-size` 建立可查詢寬度的容器：

```css
.card-container {
  container-type: inline-size; /* 宣告這是一個容器 */
}

.card {
  display: flex;
  flex-direction: column;
}

/* 當容器寬度大於 400px 時，變成橫排 */
@container (min-width: 400px) {
  .card {
    flex-direction: row;
  }
}
```

對元件化開發（Component-Driven Development）來說，這讓元件能依放置位置的空間調整樣式，在不同版面中重複使用時更方便。

## 使用前確認瀏覽器支援

這些功能在主流瀏覽器的新版本中已有支援，但個別語法和舊版瀏覽器仍要確認。下次開新專案，可以先看目標使用者的瀏覽器版本，再決定哪些地方直接用原生 CSS，哪些需要替代寫法。

---

站內相關文章：

- [CSS Grid vs Flexbox](/posts/css-grid-vs-flexbox/)
- [六種用 CSS 隱藏元素的方法](/posts/six-ways-to-hide-a-certain-element-using-css/)
