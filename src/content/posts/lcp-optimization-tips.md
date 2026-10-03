---
title: 網站 LCP 優化實戰 — 提升 25% 載入速度的經驗分享
description: 深入解析 LCP 優化的實戰技巧。分享如何診斷效能瓶頸、優化圖片載入與伺服器回應，成功提升 25% 網站載入速度的經驗。
date: 2025-02-10
updated: 2026-07-28
category: tech-deep-dive
---

最近工作上花了不少時間優化網站效能，經常需要檢查 LCP（Largest Contentful Paint）。以下整理我實際優化時的經驗，以及常用的改善方式。

## 什麼是 LCP

LCP 是 Google Core Web Vitals 的三大指標之一，衡量的是頁面主要內容載入完成的時間。簡單來說，就是使用者打開網頁後，最大的那個元素（通常是 Hero 圖片或主標題區塊）要花多久才會顯示出來。

Google 的建議是 LCP 要在 2.5 秒以內，超過 4 秒就會被標記為差。這個指標會影響 SEO 排名，所以很多專案都會特別關注。

## 常見影響 LCP 的因素

在開始優化之前，要先知道 LCP 慢的原因是什麼。常見的因素包括：

**伺服器回應時間過長**

- 主機效能不足
- 後端處理太慢
- CDN 沒設定好

**資源載入太慢**

- 圖片檔案太大
- CSS/JS 檔案太肥
- 第三方腳本阻塞渲染

**渲染阻塞**

- CSS 沒有優化
- JavaScript 阻塞頁面渲染
- 字體載入太慢

## 實際優化手法

### 圖片優化

圖片通常是 LCP 元素的主角，所以圖片優化的效果最明顯。

**使用 WebP 格式**

Google 的格式比較中，有損 WebP 在相近畫質下比 JPEG 小約 25–34%，無損 WebP 比 PNG 小約 26%。這是比較結果，不是每張圖都會縮小這麼多。我會實際比較檔案大小和畫質再選格式；向量圖示通常仍適合用 SVG。

轉換工具很多，我常用 [TinyPNG](https://tinypng.com/) 或 [Squoosh](https://squoosh.app/) 線上工具，也可以在 build 流程中自動轉換。

**設定正確的圖片尺寸**

CSS 可以控制圖片的顯示大小，但不會讓已下載的原圖變小。準備檔案時，要一起考慮顯示寬度和螢幕像素密度，避免下載遠超過需求的大圖。

對於響應式設計，可以用 `srcset` 提供不同尺寸的圖片，讓瀏覽器自動選擇適合的版本：

```html
<img
  src="/images/hero-800w.webp"
  srcset="
    /images/hero-400w.webp   400w,
    /images/hero-800w.webp   800w,
    /images/hero-1200w.webp 1200w
  "
  sizes="(max-width: 768px) 100vw, 50vw"
  alt="Hero image"
/>
```

瀏覽器會參考 `sizes` 提供的顯示寬度、裝置的 DPR 和 `srcset` 候選檔案，再決定下載哪張。以 390 px 寬、DPR 3 的手機為例，需求可能接近 1170 px，因此也可能選到 1200w。手機不一定下載最小的圖，瀏覽器還可能考慮快取和網路狀況，不能把某個檔案當成必選結果。

如果你要的是「不同螢幕給不同構圖」而不是同一張圖的不同尺寸，那要用的是 `<picture>` 搭配 `<source media>` 的 art direction 寫法，我之前做的[個人品牌網站專案](https://github.com/happyloa/Hex2025-mission2/blob/main/components/Common/Hero/Hero.vue#L31)用的就是後者。

**替 LCP 圖片提高優先級**

對首屏主圖加上 `fetchpriority="high"`，可以提示瀏覽器提高這張圖的下載優先級。這是提示，並不保證一定排在所有資源前面：

```html
<img src="/images/hero-1200w.webp" fetchpriority="high" alt="Hero image" />
```

如果那張圖是被 CSS 背景或 JS 才載入的，瀏覽器在解析 HTML 時看不到它，這時要在 `<head>` 主動預載：

```html
<link rel="preload" as="image" href="/images/hero-1200w.webp" />
```

這兩招通常能較快改善 LCP，實作成本也比較低。

**圖片懶載入**

首屏以外的圖片可以使用 `loading="lazy"` 延後載入。瀏覽器通常會在圖片接近可視範圍時開始下載，不一定等到圖片真的出現在畫面上。

不過要注意，LCP 元素的圖片不能用懶載入，不然反而會讓 LCP 變慢。

### CSS 優化

**Critical CSS**

把首屏需要的 CSS 抽出來，直接內嵌在 HTML 的 `<head>` 裡面。這樣瀏覽器不用等外部 CSS 載入就能開始渲染。

其他 CSS 可以視需要用 `<link rel="preload">` 提前下載，但 preload 本身不會套用樣式，仍要安排樣式表的載入與套用方式。

**刪除沒用到的 CSS**

很多專案用了 CSS 框架，但實際只用到一小部分樣式。可以用 PurgeCSS 之類的工具，自動移除沒用到的 CSS class。

### JavaScript 優化

**延遲載入非必要的 JS**

分析工具、聊天插件、廣告腳本這類非核心功能的 JavaScript，可以延遲載入。用 `defer` 或 `async` 屬性，或是等頁面載入完成後再動態載入。

**程式碼分割**

如果專案用了打包工具，記得設定 code splitting。把不同頁面的程式碼分開，只載入當前頁面需要的部分。

### 字體優化

自訂字體如果處理不好，也會拖慢 LCP。

**使用 font-display: swap**

這個設定讓瀏覽器先用系統字體顯示文字，等自訂字體載入後再替換。這樣使用者不用等字體載入就能看到內容。

**預先載入字體**

用 `<link rel="preload">` 告訴瀏覽器提前載入字體檔案。

**考慮用系統字體**

如果對字體沒有特別要求，用系統字體是最快的。現在的系統字體其實也蠻好看的。

### 伺服器端優化

**使用 CDN**

把靜態資源放到 CDN，讓使用者從最近的節點載入。這對圖片、CSS、JS 的載入速度都有明顯改善。

**開啟 Gzip/Brotli 壓縮**

伺服器端開啟壓縮，可以大幅減少傳輸的資料量。Brotli 的壓縮效率比 Gzip 更好，現代瀏覽器都支援。

**設定快取策略**

合理的快取設定可以讓回訪使用者直接用本地快取，不用重新下載資源。

## 如何測量 LCP

優化之前要先測量，才知道問題在哪。

**Lighthouse**

Chrome DevTools 內建的 Lighthouse 可以跑一份效能報告，會列出 LCP 時間和改善建議。

**PageSpeed Insights**

Google 的線上工具，可以同時看到實驗室數據和實際使用者數據（如果網站有足夠流量）。

**Chrome DevTools 的 Performance 面板**

Web Vitals 擴充套件已在 2025 年停止支援，功能整合進 Chrome DevTools 的 Performance 面板，可參考 [Chrome 官方公告](https://developer.chrome.com/blog/web-vitals-extension-merged)。現在可以直接用面板查看本地量測，再和實際使用者數據比較。

## 優化的順序

如果不知道從哪裡開始，建議這個順序：

1. 先跑 Lighthouse，看看最大的問題是什麼
2. 通常是圖片問題，先處理 LCP 元素的圖片
3. 檢查是否有 render-blocking 的資源
4. 優化第三方腳本的載入方式
5. 再跑一次 Lighthouse，確認改善幅度

## 結語

每次加新功能或圖片，都可能影響 LCP。定期檢查，並在新增內容後留意效能變化，才能持續維持良好的使用體驗。

改善幅度也要和門檻一起看。以 4 秒降到 3 秒為例，時間減少了 25%，但 3 秒仍屬於「待改善」。要確認是否達到 Google 的良好門檻，還得看實際使用者資料的第 75 百分位是否在 2.5 秒以內，不能只靠單次測試判斷。

---

站內相關文章：

- [SEO 優化攻略](/posts/seo-optimization-guide/)
- [瀏覽器是怎麼顯示網頁的？](/posts/how-browser-renders-webpage/)
