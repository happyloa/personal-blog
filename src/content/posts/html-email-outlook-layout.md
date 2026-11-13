---
title: HTML Email 為什麼在 Outlook 會跑版？
description: 同一封信在瀏覽器和 Gmail 都正常，到了 Windows 的 Outlook 卻擠成一團。原因是它用 Word 的引擎排版。整理哪些 CSS 不能用、為什麼還在用 table，以及寄信前怎麼檢查。
date: 2026-11-16
category: learning
---

做系統通知信的時候，我照平常寫網頁的方式排版：外層用 `max-width` 置中，兩欄用 flex。在瀏覽器裡預覽很正常，寄到 Gmail 也沒問題，但 Windows 上的 Outlook 一打開，兩欄疊在一起，寬度撐滿整個視窗，按鈕的圓角和內距也不見了。

查了之後才知道，這是 Outlook 排版方式造成的，而且 HTML Email 到現在還有一套和網頁不太一樣的寫法。

## Outlook 用 Word 來顯示信件

Windows 桌面版的 Outlook 從 2007 年開始，改用 Word 的引擎來解析和顯示 HTML 信件。[Microsoft 當年的技術文件](<https://learn.microsoft.com/en-us/previous-versions/office/developer/office-2007/aa338201(v=office.12)>)寫得很直接：Outlook 2007 使用 Word 2007 的 HTML 解析與排版引擎，Word 支援哪些 HTML 和 CSS，Outlook 就支援哪些。

Word 是文書處理軟體，它的排版模型是為了紙本文件設計的，對 CSS 的支援停在很早期的範圍。所以在這個版本的 Outlook 裡，信件比較像「被貼進 Word 的網頁」。

要注意的是，「Outlook」其實有好幾種，排版引擎不一樣：

- Windows 桌面版（現在叫 classic Outlook）：用 Word 引擎，這篇講的問題都發生在這裡。
- 網頁版 Outlook.com、Mac 版：用的是瀏覽器引擎，支援的 CSS 多很多。
- 新版 Outlook for Windows：建在 WebView2 上，畫面由網頁版 Outlook 提供，見 [Microsoft 的說明](https://learn.microsoft.com/en-us/microsoft-365-apps/outlook/overview-new-outlook-windows)，不走 Word 引擎。Microsoft 正在用它逐步取代 classic 版。

classic 版還會存在好一陣子。[Microsoft 的產品時程說明](https://learn.microsoft.com/en-us/microsoft-365-apps/outlook/get-started/guide-product-availability)提到，既有的 classic Outlook 至少會支援到 2029 年。收件人如果是企業或公部門，用 classic 版的機率不低，所以信件還是得顧到它。

## 哪些寫法在 Outlook 不能用？

各家信箱對 HTML 和 CSS 的支援，可以查 [Can I email](https://www.caniemail.com/)，它像是 Email 版的 Can I use。下面是我對照它的資料整理的，針對 Windows 桌面版 Outlook：

<div class="table-wrapper" tabindex="0" role="group" aria-label="Windows 桌面版 Outlook 的 CSS 支援情況（可水平捲動）">

| 平常的寫法                           | 在 Outlook 的情況                                | 改用什麼                                    |
| ------------------------------------ | ------------------------------------------------ | ------------------------------------------- |
| `display: flex`、`grid`              | 不支援                                           | 用 `<table>` 排版                           |
| `float`                              | 不支援                                           | `<table>`、`<img>` 的 `align` 屬性          |
| `max-width`                          | 多數版本不支援                                   | 在 `<table>` 上寫固定的 `width`             |
| `width` 寫在 `<div>`、`<p>`、`<img>` | 無效                                             | 寫在 `<table>`、`<td>`，圖片用 `width` 屬性 |
| `padding`                            | 只有 `<td>` 有效，而且同一列的上下內距會取最大值 | 把內距放在 `<td>`                           |
| `border-radius`                      | 不支援                                           | 接受直角，或用 VML                          |
| `background-image`                   | 不支援                                           | 用純色背景，或用 VML                        |
| CSS 變數（`var()`）                  | 不支援                                           | 直接寫色碼                                  |

</div>

各項的細節和版本差異，可以看 Can I email 上的 [flex](https://www.caniemail.com/features/css-display-flex/)、[max-width](https://www.caniemail.com/features/css-max-width/)、[width](https://www.caniemail.com/features/css-width/)、[padding](https://www.caniemail.com/features/css-padding/)、[border-radius](https://www.caniemail.com/features/css-border-radius/) 和 [background-image](https://www.caniemail.com/features/css-background-image/) 頁面。

回頭看我那封信：flex 不支援，所以兩欄變成上下堆疊；`max-width` 不支援，所以內容撐滿視窗；按鈕是一個加了 `padding` 和 `border-radius` 的 `<a>`，兩個都沒作用。每個症狀都對得上。

## 所以 Email 還在用 table 排版

網頁早就不用 table 排版了，但在 Email 裡，`<table>` 是所有信箱都看得懂的排版方式。一個置中、固定寬度、分成兩欄的區塊，寫出來大概是這樣：

```html
<table
  role="presentation"
  width="600"
  cellpadding="0"
  cellspacing="0"
  border="0"
  align="center"
  style="width: 600px; border-collapse: collapse;"
>
  <tr>
    <td
      width="50%"
      valign="top"
      style="padding: 16px; font-family: Arial, 'Microsoft JhengHei', sans-serif; font-size: 16px; line-height: 24px; color: #333333;"
    >
      左欄內容
    </td>
    <td
      width="50%"
      valign="top"
      style="padding: 16px; font-family: Arial, 'Microsoft JhengHei', sans-serif; font-size: 16px; line-height: 24px; color: #333333;"
    >
      右欄內容
    </td>
  </tr>
</table>
```

幾個和寫網頁不一樣的習慣：

- 寬度、對齊用 HTML 屬性寫（`width`、`align`、`valign`），因為 Outlook 對這些屬性的支援比對應的 CSS 穩定。
- `cellpadding`、`cellspacing`、`border` 都明確設成 0，不依賴各家信箱的預設值。
- 樣式盡量寫成行內的 `style`，字型、字級、顏色在每個 `<td>` 都寫一次，不指望繼承。
- 排版用的表格加上 `role="presentation"`，讓螢幕閱讀器不要把它當成資料表格來唸。

每一格都重複寫樣式，看起來很囉嗦。原因是各家信箱處理 `<style>` 的方式不一致，例如 Gmail 只支援放在 `<head>` 裡的 `<style>`，而且有大小上限，見 [Can I email 的說明](https://www.caniemail.com/features/html-style/)。關鍵的樣式寫在行內最保險。

## 兩欄被擠到下一行？

如果兩欄是用「兩張並排的 table」做的（各自 `align="left"`，手機上可以自動上下堆疊），在 Outlook 還會遇到另一個問題：兩張表的寬度加起來明明剛好，第二張卻掉到下一行。

這是因為 Outlook 會在表格左右兩側多留一點間距，總寬度就超過了容器。常見的處理方式是加上兩個 Outlook 專用的 CSS 屬性，把間距歸零：

```css
table,
td {
  mso-table-lspace: 0pt;
  mso-table-rspace: 0pt;
}
```

`mso-` 開頭的屬性是 Office 自己的擴充，其他信箱會直接忽略。如果加了還是掉下去，可以把兩欄的寬度各縮幾個像素，或者改用下一節的條件註解，只在 Outlook 裡用一張外層 table 把兩欄包成同一列的兩個 `<td>`。

不需要在手機上堆疊的話，像前面的範例那樣，直接把兩欄寫成同一列的兩個 `<td>`，最不容易出問題。

## 只寫給 Outlook 看的區塊

Word 引擎認得一種條件註解，可以包住只給 Outlook 看的內容：

```html
<!--[if mso]>
  <table role="presentation" width="600" align="center" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td>
<![endif]-->

<div style="max-width: 600px; margin: 0 auto;">信件內容</div>

<!--[if mso]>
      </td>
    </tr>
  </table>
<![endif]-->
```

對其他信箱來說，`<!--[if mso]> ... <![endif]-->` 只是一段 HTML 註解，會被略過，所以它們看到的是那個用 `max-width` 置中的 `<div>`。Windows 桌面版 Outlook 則會把註解裡的 table 當成真的標記，等於幫內容多包了一層 600px 寬的表格。

這樣就能讓支援新寫法的信箱照新的來，Outlook 另外用 table 補上。

<details>
<summary>補充：按鈕、圖片與字型</summary>

按鈕：`<a>` 上的 `padding` 在 Outlook 沒有作用，所以按鈕通常做成一個有背景色的 `<td>`，內距寫在 `<td>` 上，裡面再放連結。這樣在 Outlook 裡會是直角（其他信箱在 `<td>` 上寫 `border-radius` 還是有圓角），而且不管在哪個信箱，都只有文字的部分可以點。想在 Outlook 也有圓角和完整的點擊範圍，要用 VML（Office 支援的一種向量標記）另外畫一個，放在條件註解裡，[buttons.cm](https://buttons.cm/) 可以產生這種寫法。

圖片：寬度用 `<img>` 的 `width` 屬性指定，只寫 CSS 的 `width` 在 Outlook 無效。記得寫 `alt`，有些信箱（例如 Outlook 桌面版）預設不會自動下載外部圖片，收件人第一眼看到的可能只有替代文字。

字型：用 `@font-face` 載入網頁字型，Gmail 和 Outlook.com 都不支援。Windows 桌面版 Outlook 認得這個宣告，但不會下載遠端的字型檔，2007 到 2016 版還會略過後面的備用字型，直接顯示成 Times New Roman，見 [Can I email 的資料](https://www.caniemail.com/features/css-at-font-face/)。直接指定收件人電腦上有的字型比較實際，中文可以列出 `'Microsoft JhengHei'` 和 `'PingFang TC'`。

背景圖：Outlook 不支援 CSS 的 `background-image`，同樣得靠 VML，可以參考 [backgrounds.cm](https://backgrounds.cm/)。我自己的做法是讓設計在沒有背景圖時也能看，Outlook 就顯示純色。

</details>

## 寄出去之前怎麼檢查？

瀏覽器預覽正常，不代表信箱裡正常。我現在會這樣做：

- 至少實際寄一封到 Gmail、Windows 桌面版 Outlook 和手機上的信箱 App，三個地方都打開看。
- 用到比較新的 CSS 之前，先在 Can I email 查支援情況。
- 信件多、版型複雜時，考慮用 Litmus 或 Email on Acid 這類付費服務，一次看幾十種信箱的截圖。
- 版型儘量簡單。單欄、固定寬度、純色背景的信，在各家信箱最不容易出問題。

如果不想手寫這些 table，可以用 [MJML](https://mjml.io/) 或 [React Email](https://react.email/) 這類工具。它們讓你用比較接近元件的寫法描述版面，再編譯成包含 table 和 Outlook 條件註解的 HTML。產出的結果一樣要實際寄出去檢查。

## 站內相關文章

- [HTML 與 CSS 入門：用 Word 文件來比喻網頁的結構與樣式](/posts/html-css-basics-explained-with-word/)
- [CSS Grid vs Flexbox：到底該用哪一個？](/posts/css-grid-vs-flexbox/)
- [用 CSS 隱藏網頁元素的六種方法：完整比較與無障礙考量](/posts/six-ways-to-hide-a-certain-element-using-css/)
