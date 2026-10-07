---
title: 前端測試實戰 — 為什麼你需要寫測試？（以 Vitest 為例）
description: 為什麼前端需要寫測試？本文分享導入 Vitest 的實戰經驗與測試金字塔觀念，助你寫出更穩健、好維護的程式碼。
date: 2025-09-20
category: tech-deep-dive
---

以前在接案或是趕專案的時候，常常覺得「寫測試」是一件很奢侈的事。功能都寫不完了，哪有時間寫測試？

但隨著經手的專案越來越大，維護的時間越來越長，我發現「不寫測試」付出的代價其實更高。每次改 A 壞 B，修 B 壞 C，光是為了確認一個小改動有沒有副作用，就得手動點完整個流程，心真的很累。

以下整理我導入前端測試的心得，以及用 Vitest 測試工具函式和元件互動的方法。

## 為什麼要寫測試？

對我來說，測試除了能找 Bug，也讓我比較敢動既有的程式碼。

測試涵蓋到的行為，在重構（Refactor）時就能重新確認。我比較敢整理程式碼，是因為常用流程和曾經出錯的情況都有留下檢查；沒有涵蓋到的問題，仍可能漏掉。

測試也能補充文件。文件可能過時，直接讀邏輯又不容易看懂時，測試案例會把輸入和預期輸出列出來，幫助我理解這段程式的行為。

## 為什麼選 Vitest？

我以前用 Jest 測 Vue 專案，設定 TypeScript 和 ESM 時花了不少時間。

Vitest 基於 Vite，可以讀取 `vite.config.ts`，沿用 alias 和 plugins 等設定，對既有的 Vite 專案很方便。測試檔案可以平行執行，也能選擇 forks 或 threads 等 pool。watch 模式會依檔案變更重跑相關測試。許多 API 和 Jest 相近，但移轉時仍要核對 mock 與環境設定。

### 先準備測試環境

下面使用 Vue 3、Vitest 5、Vite 8、Vue Test Utils 2 與 jsdom 30。這組範例以 Node.js 24.15 以上的 24.x 執行環境驗證；如果沿用舊專案，先確認各套件要求的 Node 與 Vite 版本。

在已有 Vue 3 的專案中安裝測試依賴：

```bash
npm install -D vitest@5 vite@8 @vitejs/plugin-vue@6 @vue/test-utils@2 jsdom@30
```

Vue 單檔元件需要 plugin 才能編譯，`mount` 也需要 DOM 環境。Vitest 預設使用 Node，這裡改成 jsdom：

```typescript
// vitest.config.ts
import { defineConfig } from "vitest/config";
import vue from "@vitejs/plugin-vue";

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
  },
});
```

如果專案原本已在 `vite.config.ts` 設定 alias 或 plugins，獨立的 `vitest.config.ts` 不會自動把那些設定合併進來，要自行共用或用 `mergeConfig` 合併。可對照 [Vitest 環境設定](https://vitest.dev/guide/environment)與 [Vue Test Utils 安裝說明](https://test-utils.vuejs.org/installation/)。

把下面的範例檔案建好後，執行 `npx vitest run` 跑一次；開發時用 `npx vitest` 進入 watch 模式。

## 實戰：從單元測試開始

單元測試（Unit Test）通常跑得快，適合先拿純邏輯的 Utility Functions 練習。

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

這個例子把 0 和負數也列進檢查。貨幣符號可能隨 Node／瀏覽器內建的 CLDR 資料版本而不同，例如 zh-TW locale 可能顯示 `$`，而不是 `NT$`。寫斷言前，要先確認函式預期的輸出。像 `toMatch(/1,000/)` 只檢查到數字的一部分，不能證明幣別或完整格式正確；需要檢查貨幣格式時，應明確設定格式選項，並驗證對應的結果。

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

我會用測試金字塔安排檢查範圍，而不要求每個專案都達到同一個比例：

1. **Unit Tests（底層）**：寫最多，針對工具函式、複雜邏輯。跑得快、好維護。
2. **Integration Tests（中層）**：針對元件互動、API 串接。確保各個零件組起來能動。
3. **E2E Tests（頂層）**：用 Cypress 或 Playwright 跑幾個關鍵流程（如登入、結帳）。成本高、跑得慢，但最接近真實使用者。

## 結語

導入測試一開始要花時間設定環境、找出值得檢查的行為。對需要持續維護的專案，我會先把常用流程與曾經出錯的情況留下來，減少每次修改都重做同一輪手動回測的負擔。

如果還沒開始，可以先挑一個 Utility function，寫下正常輸入和邊界情況的預期結果。我自己看到終端機裡的測試通過，確實會安心不少😌

---

站內相關文章：

- [API 請求卡住怎麼辦？Timeout、Retry 與 Circuit Breaker](/posts/api-resilience-patterns/)
- [Nuxt 3 JWT 身份驗證實作筆記](/posts/nuxt3-jwt-pinia-auth/)
- [連續搜尋時，怎麼避免舊結果蓋掉新結果？](/posts/javascript-async-search-race/)
