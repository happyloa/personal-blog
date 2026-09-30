---
title: HTML 與 CSS 入門 — 用 Word 文件來比喻網頁的結構與樣式
description: 用最直覺的 Microsoft Word 比喻，帶你一次搞懂 HTML 的結構與 CSS 的樣式設計，新手入門網頁開發的最佳指南。
date: 2026-02-06
updated: 2026-07-28
category: web-basics
---

你有沒有用過 Microsoft Word？打開 Word，你可以打字、設定標題、調整字體大小和顏色、插入圖片、排版文件。

其實，寫網頁跟編輯 Word 文件的概念非常像。只不過在網頁的世界裡，我們把 Word 的功能拆成了兩個角色：

- **HTML**：負責「內容與結構」，就像你在 Word 裡打的文字、標題、清單
- **CSS**：負責「外觀與樣式」，就像你在 Word 裡設定的字體顏色、大小、對齊方式

## 先來認識 HTML — 網頁的「骨架」

HTML 的全名是 **HyperText Markup Language**（超文本標記語言）。聽起來很厲害，但其實很好理解。

### 想像一下你在 Word 裡寫文件

當你在 Word 裡寫一份報告，你會：

1. 先打一個大標題
2. 底下寫幾段內容
3. 用小標題分段
4. 列出重點清單
5. 插入圖片

HTML 做的事情一模一樣！只是寫法不同。在 Word 裡，你用滑鼠點按鈕；在 HTML 裡，你用「標籤」來告訴瀏覽器：「這是標題」、「這是段落」、「這是清單」。

### Word vs HTML 的對照表

<div class="table-wrapper" tabindex="0" role="group" aria-label="表格（可水平捲動）">

| Word 裡的操作        | HTML 標籤       | 說明                   |
| -------------------- | --------------- | ---------------------- |
| 標題 1               | `<h1>`          | 最大的標題             |
| 標題 2               | `<h2>`          | 次要標題               |
| 標題 3 ~ 標題 6      | `<h3>` ~ `<h6>` | 越來越小的標題         |
| 一般段落             | `<p>`           | 段落文字               |
| 項目符號清單（●）    | `<ul>` + `<li>` | 無序清單               |
| 編號清單（1. 2. 3.） | `<ol>` + `<li>` | 有序清單               |
| 插入圖片             | `<img>`         | 圖片                   |
| 超連結               | `<a>`           | 可以點擊的連結         |
| 文字方塊             | `<div>`         | 一個容器，用來包住內容 |

</div>

### 實際看看 HTML 長什麼樣子

假設你在 Word 裡寫了一份自我介紹：

> **自我介紹**
>
> 大家好，我是 Aaron，一個前端工程師。
>
> 我會的技能：
>
> - HTML / CSS
> - JavaScript
> - Vue.js

用 HTML 寫出來會是這樣：

```html
<h1>自我介紹</h1>

<p>大家好，我是 Aaron，一個前端工程師。</p>

<p>我會的技能：</p>
<ul>
  <li>HTML / CSS</li>
  <li>JavaScript</li>
  <li>Vue.js</li>
</ul>
```

看到了嗎？每個內容都被一對「標籤」包起來。`<h1>` 和 `</h1>` 就像是告訴瀏覽器：「這兩個標籤中間的文字是大標題喔！」

### 什麼是 Document？

在 Word 裡，你打開的每一個 `.docx` 就是一份**文件（Document）**。

在網頁的世界裡也一樣！每一個網頁就是一份 HTML Document。瀏覽器打開一個網頁，就像 Word 打開一份文件。

這就是為什麼你會在 JavaScript 裡看到 `document` 這個詞 — 它指的就是「目前這份網頁文件」。

## 再來認識 CSS — 網頁的「化妝師」

好，現在你知道 HTML 是內容和結構了。但如果只有 HTML，網頁看起來會很陽春 — 就像一份 Word 文件，你打完字但完全沒有做任何格式設定。

CSS 的全名是 **Cascading Style Sheets**（層疊樣式表）。它的工作就是幫 HTML 「化妝」。

### Word 的格式設定 = CSS

回想一下你在 Word 裡做格式設定的經驗：

<div class="table-wrapper" tabindex="0" role="group" aria-label="表格（可水平捲動）">

| Word 裡的操作   | 對應的 CSS 寫法                                     |
| --------------- | --------------------------------------------------- |
| 字體變大        | `font-size: 24px;`（示意用，實際換算 1pt ≈ 1.33px） |
| 字體顏色 → 紅色 | `color: red;`                                       |
| 粗體            | `font-weight: bold;`                                |
| 斜體            | `font-style: italic;`                               |
| 文字置中        | `text-align: center;`                               |
| 背景顏色 → 黃色 | `background-color: yellow;`                         |
| 段落間距        | `margin: 20px;`                                     |

</div>

### 實際看看 CSS 長什麼樣子

假設你想讓標題變成藍色、變大，段落的字變成灰色：

```css
h1 {
  color: blue;
  font-size: 36px;
}

p {
  color: gray;
  font-size: 16px;
}
```

CSS 的邏輯很直覺：

1. 先指定「你要改誰」（`h1`、`p`）
2. 用大括號 `{}` 包住樣式
3. 寫上「要改什麼」和「改成什麼」

就像你在 Word 裡先選取文字，然後再去按格式設定的按鈕一樣。

## HTML 和 CSS 如何一起工作？

### 用 Word 的角度來理解

在 Word 裡，你的文字內容和格式設定是混在一起的 — 你一邊打字，一邊設定格式。

但在網頁開發中，我們通常會把 **內容（HTML）** 和 **樣式（CSS）** 分開寫。這就像是：

- **HTML 檔案** = 一份純文字的文件稿
- **CSS 檔案** = 一張專門的「格式設定表」

HTML 檔案會引用 CSS 檔案，告訴瀏覽器：「請用這張表來幫我的內容化妝。」

```html
<!-- 在 HTML 檔案的開頭，引用 CSS 檔案 -->
<link rel="stylesheet" href="style.css" />
```

### 為什麼要分開？

你可能會想：「Word 混在一起也很方便啊，為什麼要分開？」

好問題！分開有幾個好處：

1. **好維護**：想改全站的字體顏色？只要改一個 CSS 檔案，不用每一頁都改
2. **好重複使用**：多個 HTML 頁面可以共用同一份 CSS
3. **職責清楚**：寫內容的人專心寫內容，做設計的人專心調樣式

這在業界叫做「**關注點分離**（Separation of Concerns）」，是軟體開發中很重要的概念。

## 一個完整的例子

讓我們把 HTML 和 CSS 組合起來，做一個簡單的個人介紹頁面：

**HTML（index.html）：**

```html
<!DOCTYPE html>
<html lang="zh-Hant">
  <head>
    <title>Aaron 的個人頁面</title>
    <link rel="stylesheet" href="style.css" />
  </head>
  <body>
    <h1>嗨，我是 Aaron 👋</h1>
    <p>我是一個前端工程師，喜歡把複雜的東西變簡單。</p>

    <h2>我會的技能</h2>
    <ul>
      <li>HTML / CSS</li>
      <li>JavaScript</li>
      <li>Vue.js / React</li>
    </ul>
  </body>
</html>
```

**CSS（style.css）：**

```css
body {
  /* 中文字體要疊好幾層：Mac 用 PingFang、Windows 用微軟正黑體，
     都沒有時再退回 Noto Sans TC 與系統預設的無襯線字體。
     只寫「微軟正黑體」的話，非 Windows 的讀者根本吃不到這個設定。 */
  font-family: "PingFang TC", "Microsoft JhengHei", "Noto Sans TC", sans-serif;
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
}

h1 {
  color: #2563eb;
}

h2 {
  color: #475569;
}

li {
  padding: 4px 0;
}
```

這就像你在 Word 裡寫了一份文件，然後用格式設定把它變好看一樣 — 只不過我們是用程式碼來達成的。

## 常見問題 Q&A

### Q：HTML 標籤那麼多，要全部背起來嗎？

不用！常用的大概就十幾個。`h1`~`h6`、`p`、`div`、`a`、`img`、`ul`/`ol`/`li`、`span`、`button`、`input` 這些就夠應付大部分情境了。其他的用到再查就好，像是可以到 [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements) 查詢。

### Q：CSS 好像很複雜，有沒有簡單的學習方式？

CSS 的基礎其實不難，就是「選擇器 + 屬性 + 值」的組合。建議從修改現有的範例開始，比如改改顏色、字體大小，慢慢就會有感覺了。

### Q：學會 HTML 和 CSS 就可以做網站了嗎？

可以做出靜態的網頁，甚至連表單都能用純 HTML（`<form action method>`）把資料送到伺服器！但如果你想要更豐富的互動效果（像是點擊按鈕即時更新畫面內容、表單送出後不整頁刷新就顯示結果），就需要再學 JavaScript。你可以把 JavaScript 想成 Word 裡的「巨集（Macro）」 — 自動化的腳本。

## 結語

回顧一下今天學到的：

- **HTML** = Word 的文字內容與結構（標題、段落、清單）
- **CSS** = Word 的格式設定（字體、顏色、排版）
- **Document** = 一份網頁文件
- 兩者通常**分開寫**，各司其職

下次打開一個網頁的時候，試試在頁面上按右鍵 → 「檢視原始碼」，你會看到滿滿的 HTML 標籤。別怕，那些就只是跟 Word 一樣的「格式標記」而已！

---

- [MDN Web Docs — HTML 入門](https://developer.mozilla.org/zh-TW/docs/Learn/HTML/Introduction_to_HTML)
- [MDN Web Docs — CSS 入門](https://developer.mozilla.org/zh-TW/docs/Learn/CSS/First_steps)

---

站內相關文章：

- [瀏覽器是怎麼顯示網頁的？](/posts/how-browser-renders-webpage/)
- [用 CSS 隱藏網頁元素的六種方法](/posts/six-ways-to-hide-a-certain-element-using-css/)
