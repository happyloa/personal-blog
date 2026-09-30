---
title: 前端測試實戰 — 為什麼你需要寫測試？（以 Vitest 為例）
description: 為什麼前端需要寫測試？本文分享導入 Vitest 的實戰經驗與測試金字塔觀念，助你寫出更穩健、好維護的程式碼。
date: 2025-09-20
category: tech-deep-dive
---

以前在接案或是趕專案的時候，常常覺得「寫測試」是一件很奢侈的事。功能都寫不完了，哪有時間寫測試？

但隨著經手的專案越來越大，維護的時間越來越長，我發現「不寫測試」付出的代價其實更高。每次改 A 壞 B，修 B 壞 C，光是為了確認一個小改動有沒有副作用，就得手動點完整個流程，心真的很累。

這篇想分享一下我開始在前端專案導入測試的心路歷程，以及如何用 Vitest 進行實戰。

## 為什麼要寫測試？

對我來說，寫測試最大的好處不是「找 Bug」，而是 **「安心感」**。

當你有一套完整的測試案例保護著你的程式碼，你就有底氣去重構（Refactor）。你知道如果在重構過程中不小心弄壞了什麼，測試會馬上告訴你。這種「不怕改壞」的信心，對於長期維護專案來說至關重要。

此外，測試其實是**最好的文件**。看文件可能會過時，看程式碼邏輯可能太複雜，但看測試案例，你可以很清楚知道：輸入什麼，預期會輸出什麼。

## 為什麼選 Vitest？

以前 Vue 專案大多用 Jest，但 Jest 的設定真的很繁瑣，尤其是遇到 TypeScript 和 ESM 的時候。

Vitest 是基於 Vite 的測試框架，最大的優點就是：**設定幾乎零成本**。它直接讀取你的 `vite.config.ts`，也就是說你的 alias、plugins 設定都不用重寫一遍。而且它的速度非常快（因為共用 Vite 的 esbuild 轉譯管線，還會平行執行測試檔案——預設用多行程 fork，也可切換成 threads；watch 模式下也會像 HMR 一樣，只重跑受影響檔案對應的測試），API 也跟 Jest 幾乎相容。

## 實戰：從單元測試開始

單元測試（Unit Test）是成本最低、回饋最快的測試。通常適合拿來測純邏輯的 Utility Functions。

假設我們有一個格式化金額的函式：

```typescript
// utils/currency.ts
export function formatCurrency(amount: number, currency = "TWD"): string {
  return new Intl.NumberFormat("zh-TW", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
  }).format(amount);
}
```

對應的測試可以這樣寫：

```typescript
// utils/currency.test.ts
import { describe, it, expect } from "vitest";
import { formatCurrency } from "./currency";

describe("formatCurrency", () => {
  it("應該正確格式化台幣", () => {
    expect(formatCurrency(1000)).toBe("$1,000");
  });

  it("應該可以處理不同幣別", () => {
    expect(formatCurrency(1000, "USD")).toBe("US$1,000");
  });

  it("應該處理 0 元", () => {
    expect(formatCurrency(0)).toBe("$0");
  });

  it("應該處理負數", () => {
    expect(formatCurrency(-1000)).toBe("-$1,000");
  });
});
```

這種測試寫起來很快，而且可以確保邊界情況（比如 0、負數）都有被處理到。順帶一提，貨幣符號字串會隨 Node／瀏覽器內建的 CLDR 資料版本而不同（例如 zh-TW locale 目前顯示的是 `$` 而非 `NT$`），實際斷言請以你環境跑出來的結果為準，或改用 `toMatch(/1,000/)` 這類不綁定符號的寬鬆寫法，比較不怕未來 CLDR 更新。

## 進階：元件測試

前端最複雜的是 UI 元件。這裡我們不只要像單元測試那樣測邏輯，還要測「互動」和「渲染」。

使用 `Vue Test Utils` 配合 Vitest，我們可以模擬使用者的操作。

比如一個簡單的計數器元件：

```vue
<!-- components/Counter.vue -->
<template>
  <button @click="count++">Count is: {{ count }}</button>
</template>

<script setup>
import { ref } from "vue";
const count = ref(0);
</script>
```

測試可以這樣寫：

```typescript
// components/Counter.test.ts
import { mount } from "@vue/test-utils";
import { describe, it, expect } from "vitest";
import Counter from "./Counter.vue";

describe("Counter", () => {
  it("初始值應該是 0", () => {
    const wrapper = mount(Counter);
    expect(wrapper.text()).toContain("Count is: 0");
  });

  it("點擊後數字應該增加", async () => {
    const wrapper = mount(Counter);

    // 模擬點擊
    await wrapper.find("button").trigger("click");

    expect(wrapper.text()).toContain("Count is: 1");
  });
});
```

## 該寫多少測試？測試金字塔原則

常常有人糾結要寫多少測試。我的建議是遵循測試金字塔的原則：

1. **Unit Tests（底層）**：寫最多，針對工具函式、複雜邏輯。跑得快、好維護。
2. **Integration Tests（中層）**：針對元件互動、API 串接。確保各個零件組起來能動。
3. **E2E Tests（頂層）**：用 Cypress 或 Playwright 跑幾個關鍵流程（如登入、結帳）。成本高、跑得慢，但最接近真實使用者。

## 結語

導入測試一開始會有陣痛期，覺得開發變慢了。但把時間軸拉長來看，它省下的是無數次「手動回測」和「線上救火」的時間。

如果你還沒開始寫測試，建議從最簡單的 Utility function 開始。先求有，再求好。你會發現，看著終端機亮起一整排綠色的 Pass，真的是一件很療癒的事情😌

---

站內相關文章：

- [API 請求卡住怎麼辦？Timeout、Retry 與 Circuit Breaker](/posts/api-resilience-patterns/)
- [Nuxt 3 JWT 身份驗證實作筆記](/posts/nuxt3-jwt-pinia-auth/)
