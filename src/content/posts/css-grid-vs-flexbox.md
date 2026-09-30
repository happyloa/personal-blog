---
title: CSS Grid vs Flexbox — 到底該用哪一個？
description: 還分不清楚什麼時候該用 Grid，什麼時候該用 Flexbox 嗎？這篇文章用清楚的排版案例和程式碼範例，幫你釐清兩者的最佳使用時機。
date: 2026-02-17
category: learning
---

「這個版面要用 Grid 還是 Flexbox？」這恐怕是每個前端新手（甚至老手）都曾經糾結過的問題。

兩者都能做排版，很多時候也能互換。但它們的設計初衷其實是不同的。

## 根本差異：一維 vs 二維

### Flexbox：一維排版（1D Layout）

Flexbox 處理的是**一條線**上的排列。不管你是橫著排（`row`）還是直著排（`column`），它一次只關心一個維度。

- **強項**：內容對齊、分配剩餘空間、元素順序重排。
- **適用場景**：導覽列（Navbar）、按鈕群組、卡片內部的內容排列。

### CSS Grid：二維排版（2D Layout）

Grid 處理的是**平面**上的排列。它同時關心**行（Row）** 和 **列（Column）**。

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

這種同時要控制橫向寬度和直向高度的佈局，Grid 寫起來非常乾淨直觀，完全不需要用 `float` 或計算百分比。

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

這是 Grid 最強大的功能之一：**響應式網格**。只要一行程式碼，卡片就會自動換行、自動填滿寬度，完全不需要 Media Query。

如果用 Flexbox 做，你還要處理最後一排卡片寬度不一樣的問題，會麻煩很多。

## 混合使用才是王道

在真實專案中，我們很少只用其中一個。通常是大架構用 Grid，局部元件用 Flexbox。

例如：

1. **Grid** 規劃大區塊（Header, Main, Footer）。
2. **Flexbox** 處理 Header 裡面的 Logo 和選單對齊。
3. **Grid** 排列 Main 裡面的文章列表。
4. **Flexbox** 處理文章卡片裡面的標籤和日期。

## 結論

- 要**對齊內容**？用 **Flexbox**。
- 要**規劃佈局**？用 **Grid**。
- 只處理**一行/一列**？用 **Flexbox**。
- 同時處理**行與列**？用 **Grid**。

不用二選一，把它們當成你的左右手，依照情境靈活切換，你的 CSS 寫起來會更輕鬆愉快。

---

站內相關文章：

- [六種用 CSS 隱藏元素的方法](/posts/six-ways-to-hide-a-certain-element-using-css/)
- [HTML/CSS 基礎觀念](/posts/html-css-basics-explained-with-word/)
