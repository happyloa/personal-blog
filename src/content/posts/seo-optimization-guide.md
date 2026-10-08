---
title: 網站 SEO 優化攻略 — 從技術面提升搜尋排名的實戰經驗（2026 更新版）
description: 從網站 SEO 專案經驗出發，整理索引、HTML 結構、Core Web Vitals 與量測方式，也看看 AI Overviews 出現後需要留意哪些變化。
date: 2026-01-30
category: tech-deep-dive
---

之前在啟程教育學院工作時，有一段時間專注在網站的 SEO 優化。當時讓 5 組商業關鍵字在 4 週內進入搜尋排名前 3，網站的自然流量也成長了 120%。以下整理技術面優化的經驗，以及 2025-2026 年的搜尋趨勢。

這些數字是當時專案的觀察，不能當成做完同樣調整就會得到的結果。排名會受查詢字詞、地區與時間影響，流量也可能同時受內容、季節和其他因素影響；評估自己的網站時，要先固定比較期間與量測方式。

## AI 搜尋出現後，我會多留意什麼？

### AI Overviews 改變搜尋生態

Google 在 2025 年 7 月 23 日的[第二季財報電話會議](https://abc.xyz/2025-q2-earnings-call)中公布，AI Overviews 已超過每月 20 億用戶。搜尋結果直接顯示答案後，讀者可能不用點進網站就得到資訊；自己的網站是否因此少了流量，還是要看實際數據。

因此，除了爭取搜尋排名，也需要考慮如何讓內容被 AI 引用。

### 用 E-E-A-T 檢查內容依據

Google 用 E-E-A-T 這幾個面向評估內容品質。[官方內容品質說明](https://developers.google.com/search/docs/fundamentals/creating-helpful-content)也提醒，它不是一個獨立的排名因子。它不能保證內容會被 AI 引用，但可以拿來檢查文章是否交代清楚經驗和依據：

- **Experience（經驗）**：第一手經驗
- **Expertise（專業）**：專業知識
- **Authoritativeness（權威）**：領域權威
- **Trustworthiness（可信度）**：值得信賴

### 從關鍵字到實體（Entity-Based SEO）

搜尋引擎會理解「實體」（人、事、物）之間的關係，關鍵字匹配只是其中一部分。使用結構化資料，並完整整理相關主題，有助於表達這些關係。

## 基本 HTML 結構

### Title 和 Meta Description

```html
<title>公司名稱 | 服務項目 - 簡短描述</title>
<meta name="description" content="中文頁面控制在 70-80 字左右的頁面描述" />
```

Google 沒有規定 Meta Description 的字數上限，顯示時會依裝置和版面截斷，也可能改用頁面內容生成摘要，可參考[官方摘要文件](https://developers.google.com/search/docs/appearance/snippet)。範例中的 70–80 字只是寫作時方便控制篇幅的參考，重點是先把頁面內容說清楚，別把固定字數當成排名規則。

### Heading 結構

我會讓一個頁面有一個清楚的 `<h1>` 主標題。這是為了讓讀者容易理解頁面結構，不是 Google 規定只能有一個 `<h1>`。接著用 `<h2>`、`<h3>` 整理段落層級，避免只為了字體大小選標籤。

### 語意化標籤

使用 `<header>`、`<nav>`、`<main>`、`<article>`、`<footer>` 等 HTML5 語意標籤。

## 讓搜尋系統容易理解內容

- **結構清晰**：使用標題層級、條列、表格、FAQ 格式
- **直接回答**：內容開頭就回答問題，再詳細解釋
- **交代自己的經驗與依據**：例如做過的調整、觀察到的結果，以及方法的限制
- **依內容選擇結構化資料**：Google 的 AI 搜尋不要求特別加入 `FAQPage` 或 `HowTo`。標記要和頁面內容一致，也不保證會被引用

Google 的 [AI 搜尋文件](https://developers.google.com/search/docs/appearance/ai-features)說明，頁面仍需先能被索引、符合摘要顯示資格；沒有另一套特別的 AI 標記要求。

## Core Web Vitals 與優化目標

<div class="table-wrapper" tabindex="0" role="group" aria-label="表格（可水平捲動）">

| 指標    | 衡量內容     | 官方良好門檻 | 本文建議目標 |
| ------- | ------------ | ------------ | ------------ |
| **LCP** | 最大內容繪製 | ≤ 2.5 秒     | **≤ 2.0 秒** |
| **INP** | 互動回應速度 | ≤ 200 毫秒   | ≤ 200 毫秒   |
| **CLS** | 版面位移     | ≤ 0.1        | ≤ 0.1        |

</div>

**注意**：INP 已正式取代 FID；表中的 LCP 2.0 秒是筆者建議的優化目標，Google 官方「良好」門檻目前仍是 2.5 秒。

### 改善 INP

1. 減少 JavaScript 執行時間
2. 分割長任務（用 `setTimeout` 讓出主執行緒）
3. 減少 DOM 操作
4. 使用 Web Worker 處理耗時計算

## 多平台可見度

使用者也會在 YouTube、社群媒體、Reddit，以及 AI 聊天機器人（ChatGPT、Gemini）尋找資訊。這些是增加曝光的管道，但不能直接把「被提及」當成已確認的 Google 排名訊號。

## 必備工具設定

### Google Search Console

- 提交 sitemap
- 查看搜尋表現和 Core Web Vitals 報告
- 監控爬蟲問題

### Google Analytics 4

- 追蹤流量來源
- 監控轉換目標
- 分析使用者行為

## 實務經驗

1. **先確認能被收錄**：檢查爬取、索引與頁面內容，避免搜尋系統根本讀不到要呈現的資訊
2. **回到讀者的問題**：速度和結構要顧，內容也要真正回答查詢需求
3. **留時間觀察**：調整後可能要幾週到幾個月才看得出變化，也不保證每次修改都有效
4. **留意搜尋呈現方式**：觀察摘要和 AI 答案出現後，曝光、點擊與轉換有沒有變化
5. **持續交代內容依據**：把作者背景、資料來源和實際案例寫清楚，讓讀者容易判斷

---

站內相關文章：

- [LCP 優化實戰](/posts/lcp-optimization-tips/)
- [瀏覽器是怎麼顯示網頁的？](/posts/how-browser-renders-webpage/)
