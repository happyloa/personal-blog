---
title: 你可能還不知道的現代 CSS 功能 — Nesting、:has() 與 @container
description: CSS 進化得太快了！這篇文章介紹三個改變遊戲規則的新功能，讓你的 CSS 寫法更強大、更簡潔。
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

現在原生 CSS 也支援這個語法，現代瀏覽器都已經可以使用。

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

RWD（響應式設計）一直以來都是基於 **視窗寬度（Viewport Width）**，也就是 `@media (max-width: 768px)`。

但這有個問題：一個卡片元件，放在側邊欄（窄）和放在主內容區（寬），我們希望它長得不一樣。但 `@media` 不知道卡片現在在多寬的容器裡。

`@container` 解決了這個問題。它是基於**父容器的寬度**來做變化。

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

## 結語

這些功能現在已經有主流瀏覽器支援。下次開新專案，可以試著直接使用原生 CSS，看看是否還需要預處理器，以及哪些寫法能讓樣式更好維護。

---

站內相關文章：

- [CSS Grid vs Flexbox](/posts/css-grid-vs-flexbox/)
- [六種用 CSS 隱藏元素的方法](/posts/six-ways-to-hide-a-certain-element-using-css/)
