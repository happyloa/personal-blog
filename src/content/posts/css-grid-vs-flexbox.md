---
title: CSS Grid vs Flexbox — 到底該用哪一個？
description: 還分不清楚什麼時候該用 Grid，什麼時候該用 Flexbox 嗎？這篇文章用清楚的排版案例和程式碼範例，幫你釐清兩者的最佳使用時機。
date: 2026-02-17
category: learning
---

切版時，經常需要決定：「這個版面要用 Grid 還是 Flexbox？」

兩者都能做排版，很多時候也能互換。但它們的設計初衷其實是不同的。

## 根本差異：一維 vs 二維

### Flexbox：一維排版（1D Layout）

Flexbox 主要沿著一條主軸安排內容，可以橫排（`row`）或直排（`column`），也能換行。不過換行後，各行會各自分配空間，不像 Grid 能讓上下幾排共用同一組欄線。

- **強項**：內容對齊、分配剩餘空間、元素順序重排。
- **適用場景**：導覽列（Navbar）、按鈕群組、卡片內部的內容排列。

### CSS Grid：二維排版（2D Layout）

Grid 可以同時規劃橫列（Row）與直欄（Column），讓元素沿著兩個方向對齊。

- **強項**：整體頁面佈局、複雜的網格系統、重疊元素。
- **適用場景**：整個網頁的結構（Header + Sidebar + Content + Footer）、相片牆（Gallery）。

---

## 實戰案例判斷

### 案例 1：導覽列（Navbar）

```
[Logo]                [Home] [About] [Contact]
```

**推薦：Flexbox**

```css
.navbar {
  display: flex;
  justify-content: space-between; /* 左右推開 */
  align-items: center; /* 垂直置中 */
}
```

這裡我們只關心「左邊一個，右邊一組」，是典型的一維排列。

### 案例 2：聖杯佈局（Holy Grail Layout）

```
-------------------------
|       Header          |
-------------------------
| Nav |  Content  | Ads |
-------------------------
|       Footer          |
-------------------------
```

**推薦：Grid**

```css
.container {
  display: grid;
  grid-template-areas:
    "header header header"
    "nav    main   ads"
    "footer footer footer";
  grid-template-columns: 200px 1fr 200px;
  grid-template-rows: auto 1fr auto;
}
```

這個佈局要同時控制橫向寬度和直向高度，用 Grid 可以定義區域，不需要用 `float` 或自行計算百分比。上面的範例只設定了容器，子元素還要各自指定對應的 grid-area，才會進入 header、nav 等區域。

### 案例 3：卡片列表（Card Grid）

```
[Card] [Card] [Card]
[Card] [Card] [Card]
```

**推薦：Grid**

```css
.cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
}
```

這裡用響應式網格，讓卡片自動換行並填滿寬度，一行設定就能處理，不需要另外寫 Media Query。

如果希望每排卡片都對齊相同的欄線，Grid 通常比較容易處理。上面的範例把最小欄寬設為 250 px，容器更窄時可能溢出，仍要依手機版面調整最小寬度。

## 同一頁面可以搭配使用

在真實專案中，我們很少只用其中一個。通常是大架構用 Grid，局部元件用 Flexbox。

例如：

1. **Grid** 規劃大區塊（Header, Main, Footer）。
2. **Flexbox** 處理 Header 裡面的 Logo 和選單對齊。
3. **Grid** 排列 Main 裡面的文章列表。
4. **Flexbox** 處理文章卡片裡面的標籤和日期。

## 結論

我會先看要控制的是哪種關係：一組內容沿同一個方向排列、分配空間時，先考慮 Flexbox；需要多排共用欄線，或同時定義橫列與直欄時，先考慮 Grid。同一個頁面可以搭配使用，不必為了統一寫法硬選一種。

---

站內相關文章：

- [六種用 CSS 隱藏元素的方法](/posts/six-ways-to-hide-a-certain-element-using-css/)
- [HTML/CSS 基礎觀念](/posts/html-css-basics-explained-with-word/)
