export const site = {
  title: "Aaron 的部落格",
  name: "Aaron's Space",
  description:
    "前後端開發、網站架構與學習路上的實作筆記。記錄 Vue、React、效能優化、SEO 與網路基礎的踩坑經驗。",
  author: "Aaron",
  githubUrl: "https://github.com/happyloa",
  cakeUrl: "https://www.cake.me/aaron-yumin",
  defaultOgImage: "/og-default.png",
};

/**
 * 把資料序列化成可安全嵌入 <script type="application/ld+json"> 的字串。
 * Astro 的 set:html 不做跳脫，若標題或摘要出現字面上的 </script>，
 * 瀏覽器會提早結束整個 script 區塊、把後面的頁面內容當成 HTML 解析。
 * 這站主題本來就會談 HTML 與瀏覽器渲染，出現這種字串並非假想情境。
 * @param {unknown} data 要序列化的結構化資料
 * @returns {string} 已跳脫角括號的 JSON 字串
 */
export const toJsonLd = (data) =>
  JSON.stringify(data).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e");

export const navLinks = [
  { href: "/", label: "首頁" },
  { href: "/categories/", label: "分類" },
];
