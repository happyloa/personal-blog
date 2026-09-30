---
title: 你可能還不知道的現代 CSS 功能 — Nesting、:has() 與 @container
description: CSS 進化得太快了！這篇文章介紹三個改變遊戲規則的新功能，讓你的 CSS 寫法更強大、更簡潔。
date: 2026-02-18
category: learning
---

CSS 在這幾年彷彿開了外掛，推出了許多大家敲碗已久的功能。如果你還停留在 SASS/SCSS 的時代，是時候來看看原生 CSS 現在有多強大了。

## 1. 原生巢狀（Nesting）

以前我們一定要用 SCSS 才能這樣寫：

```scss
/* SCSS */
.card {
  background: white;

  .title {
    color: black;
  }
}
```

現在，原生 CSS 直接支援了！所有現代瀏覽器都已經支援這個語法。

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

**優點**：不用編譯器，瀏覽器原生讀得懂。結構更清晰，減少重複寫 selector。

## 2. 父層選擇器 :has()

這大概是 CSS 歷史上被敲碗最久的功能。以前我們只能往下選（Parent > Child），不能往上選（Child < Parent）。

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

**威力強大**：它不只是父層選擇器，更像是「條件選擇器」。

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

這對於元件化開發（Component-Driven Development）來說是革命性的改變。元件終於可以真正做到「隨處可用，自動適應」。

## 結語

這些 CSS 新招早就不是什麼做夢才有的「未來科技」了，現在主流瀏覽器幾乎都全面支援。下次開新專案的時候，不如大膽一點，跳過 CSS 預處理器，直接來感受原生 CSS 的威力吧，保證寫起來超有成就感的！

---

站內相關文章：

- [CSS Grid vs Flexbox](/posts/css-grid-vs-flexbox/)
- [六種用 CSS 隱藏元素的方法](/posts/six-ways-to-hide-a-certain-element-using-css/)
