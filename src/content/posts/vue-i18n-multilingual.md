---
title: Vue i18n 多語系網站開發實作 — 從設定到維護的經驗分享
description: 完整教學：使用 Vue i18n 開發多語系網站。從基礎設定、動態內容翻譯到 SEO 考量，分享實務上的開發經驗與避坑指南。
date: 2022-02-15
updated: 2026-07-28
category: learning
---

之前做過一個航運公司的企業形象網站，需要支援中英文切換。以下整理使用 Vue i18n 的設定方式，以及開發和維護多語系網站時遇到的問題。

## 為什麼需要多語系

如果網站面向不同國家的客群，或公司有海外業務，就需要讓使用者用熟悉的語言閱讀內容。多語系支援能減少理解上的障礙，也有助於呈現公司的國際業務形象。

## Vue i18n 基本設定

[Vue i18n](https://vue-i18n.intlify.dev/) 是 Vue 生態系中最常用的多語系套件。安裝完之後，基本的設定長這樣：

```javascript
// i18n/index.js
import { createI18n } from "vue-i18n";
import zhTW from "./locales/zh-TW.json";
import en from "./locales/en.json";

const i18n = createI18n({
  legacy: false,
  locale: "zh-TW",
  fallbackLocale: "en",
  messages: {
    "zh-TW": zhTW,
    en: en,
  },
});

export default i18n;
```

翻譯檔案就是一般的 JSON。下方頂端的註解用來標示檔案位置，實際存成 JSON 時要移除；後面的翻譯範例也一樣，JSON 本身不接受註解。

```json
// locales/zh-TW.json
{
  "nav": {
    "home": "首頁",
    "about": "關於我們",
    "services": "服務項目",
    "contact": "聯絡我們"
  },
  "home": {
    "title": "歡迎來到我們的網站",
    "description": "專業的國際航運服務"
  }
}
```

## 在元件中使用

在 template 裡面用 `$t()` 來取得翻譯文字：

```vue
<template>
  <nav>
    <a href="/">{{ $t("nav.home") }}</a>
    <a href="/about">{{ $t("nav.about") }}</a>
  </nav>
</template>
```

在 script 裡面則用 `useI18n`：

```vue
<script setup>
import { useI18n } from "vue-i18n";

const { t, locale } = useI18n();

const switchLanguage = (lang) => {
  locale.value = lang;
};
</script>
```

（純 Vue 專案沒有 auto-import，`useI18n` 一定要自己 import；如果是 Nuxt 搭配
`@nuxtjs/i18n`，這行才可以省略。）

## 語言切換的 UI

使用者要能切換語言，通常會在 header 放一個語言選擇器：

```vue
<template>
  <select v-model="locale">
    <option value="zh-TW">中文</option>
    <option value="en">English</option>
  </select>
</template>
```

切換後要記住使用者的選擇，下次進來還是同樣的語言。可以存在 localStorage：

```javascript
// 切換語言時
const switchLanguage = (lang) => {
  locale.value = lang;
  localStorage.setItem("locale", lang);
};

// 初始化時讀取
const savedLocale = localStorage.getItem("locale");
if (savedLocale) {
  locale.value = savedLocale;
}
```

這段範例適用於瀏覽器端。若放進 Nuxt 的 SSR 流程，讀取 localStorage 前要確認是在客戶端，也要處理伺服器與瀏覽器初始語言不同時的畫面同步。

## 翻譯檔案的管理

專案越做越大，翻譯檔案也會越來越肥。有幾個管理上的建議：

**拆分檔案**

不要把所有翻譯都塞在一個 JSON 裡面，按功能或頁面拆分：

```
locales/
  zh-TW/
    common.json
    home.json
    about.json
  en/
    common.json
    home.json
    about.json
```

**命名規則要一致**

key 的命名最好有規則可循，例如 `頁面.區塊.元素`。這樣找翻譯的時候比較快，也比較不會重複。

**避免太深的巢狀**

巢狀太深會讓 key 變得很長，寫起來麻煩，也不好維護。通常三層以內比較適當。

## 處理複數和變數

有些文字會包含變數，或是需要處理複數形式：

```json
// locales/zh-TW.json
{
  "items": {
    "count": "共 {count} 個項目"
  }
}
```

```vue
<p>{{ $t('items.count', { count: 5 }) }}</p>
<!-- 輸出：共 5 個項目 -->
```

英文的複數比較麻煩，好在 Vue i18n 有內建處理：

```json
// locales/en.json（同一個 items.count key，換成 en 語系的複數寫法）
{
  "items": {
    "count": "no items | one item | {count} items"
  }
}
```

## 日期和數字格式

不同語系的日期和數字格式也不一樣。Vue i18n 有提供相關功能：

```javascript
const i18n = createI18n({
  // ...
  datetimeFormats: {
    "zh-TW": {
      short: { year: "numeric", month: "2-digit", day: "2-digit" },
    },
    en: {
      short: { year: "numeric", month: "short", day: "numeric" },
    },
  },
});
```

```vue
<p>{{ $d(new Date(), 'short') }}</p>
<!-- zh-TW: 2025/03/15 -->
<!-- en: Mar 15, 2025 -->
```

## SEO 注意事項

多語系網站的 SEO 有些要注意的地方：

**設定 lang 屬性**

HTML 標籤要加上正確的語言屬性：

```html
<html lang="zh-TW"></html>
```

切換語言時也要更新這個屬性。

**hreflang 標籤**

告訴搜尋引擎這個頁面有其他語言版本：

```html
<link rel="alternate" hreflang="zh-TW" href="https://example.com/zh-TW/about" />
<link rel="alternate" hreflang="en" href="https://example.com/en/about" />
```

## 實務經驗

做過多語系專案後，有些經驗可以分享：

1. **一開始就規劃好**：後期才加多語系會很痛苦，一開始就用 `$t()` 來寫，後面加語言就輕鬆很多

2. **翻譯內容需要語言校對**：重要文字可以請專業翻譯人員或熟悉該語言的人確認，工程端則處理載入、插值和顯示方式

3. **測試每個語系**：切換到其他語言後，版面可能會跑掉，因為不同語言的文字長度不一樣。英文和中文的長度差異尤其大

4. **圖片也要處理**：如果圖片上有文字，也需要準備不同語言的版本

## 結語

多語系網站需要處理翻譯，也要顧到日期與數字格式、不同文字長度造成的版面變化，以及 SEO 設定。從專案初期就規劃翻譯檔案與命名方式，後續增加語言時會比較好維護。

---

站內相關文章：

- [從 Vue 跳到 React 的開發心得](/posts/vue-to-react-transition/)
- [藝術銀行 Art Bank 開發紀錄](/posts/artbank-nuxt3-ssr-development/)
