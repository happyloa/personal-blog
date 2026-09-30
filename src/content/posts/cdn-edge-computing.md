---
title: CDN 與 Edge Computing — 為什麼有些網站就是比較快？
description: 你的網站伺服器在美國，為什麼台灣的使用者還能秒開？揭開 CDN 加速的祕密，以及邊緣運算（Edge Computing）如何改變現代網頁開發。
date: 2026-02-15
category: web-basics
---

當你在台灣打開一個架設在美國紐約的網站，理論上光是訊號來回跑一趟就要花上約 200 毫秒（ms）。再加上伺服器處理時間、傳輸圖片的時間，網頁載入可能要好幾秒。

但為什麼很多國外的大型網站（如 Facebook, Netflix）在台灣開啟還是飛快？答案就是 **CDN（Content Delivery Network）**。

## CDN 是什麼？

CDN 是由一群分佈在世界各地的伺服器組成的網路。它們的功能很單純：**快取（Cache）** 原始網站的內容，並且就近提供給使用者。

### 運作原理

1. **Origin Server（原始伺服器）**：這是你架設網站的地方（例如在紐約）。
2. **Edge Server（邊緣伺服器）**：這是 CDN 廠商（如 Cloudflare, AWS CloudFront）在世界各地機房裡的伺服器（例如在台北）。

當台北的使用者第一次請求你的圖片：

1. 請求先送到**台北的 Edge Server**。
2. Edge Server 發現自己沒有這張圖，於是向**紐約的 Origin Server** 要。
3. Origin Server 把圖片傳給 Edge Server。
4. Edge Server 把圖片傳給使用者，並且**存一份在自己硬碟裡**。

當第二個台北使用者請求同一張圖片：

1. 請求送到**台北的 Edge Server**。
2. Edge Server 發現自己有快取，**直接傳給使用者**。
3. 使用者感覺「秒開」，因為圖片是從台北傳來的，不需要橫跨太平洋。

## 什麼是 Edge Computing（邊緣運算）？

傳統的 CDN 只能快取**靜態檔案**（圖片、CSS、JS）。如果網頁內容是動態生成的（例如個人化的購物車、登入後的頁面），還是得回到原始伺服器處理。

**Edge Computing** 改變了這點。它讓你可以把**程式碼**（Function）部署到 CDN 的邊緣節點上執行。

### 應用場景

1. **A/B Testing**：在邊緣節點就決定要給使用者看 A 版還是 B 版頁面，不用回到源站。
2. **身分驗證**：在邊緣節點驗證 JWT Token，如果不合法直接擋掉，減輕源站負擔。
3. **個人化內容**：根據使用者的地理位置（GeoIP），在邊緣節點直接修改回應內容（例如顯示當地貨幣）。

這就是為什麼現在很流行 **Serverless** 和 **Edge Functions**（如 Vercel Edge Middleware, Cloudflare Workers）。它們讓運算發生在離使用者最近的地方，達到極致的效能。

## 為什麼你需要 CDN？

1. **速度**：就近存取，減少延遲（Latency）。
2. **可靠性**：如果原本的伺服器掛了，CDN 可以提供快取的版本，或是自動導流到備用伺服器。
3. **安全性**：CDN 通常提供 **DDoS 防護**和 **WAF（Web Application Firewall）**，幫你擋下惡意流量，保護源站。
4. **成本**：CDN 的頻寬費用通常比雲端主機（如 AWS EC2）便宜。

說真的，現在做網站如果沒上 CDN，光是載入速度就會被使用者嫌到不行。不管你是為了 SEO 還是讓使用者不要等到離開，花點時間設定 CDN 絕對是最划算的一件事。

---

站內相關文章：

- [網站 SEO 優化攻略](/posts/seo-optimization-guide/)
- [DNS 深度解析](/posts/dns-deep-dive/)
