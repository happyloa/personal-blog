/**
 * 把單行內的 [文字](網址) 換成文字。
 * 用 indexOf 掃描：同樣功能的正規表示式遇到大量未閉合的括號時，耗時呈平方成長。
 * @param {string} line
 */
const stripLineLinks = (line) => {
  let result = "";
  let from = 0;
  for (;;) {
    const open = line.indexOf("[", from);
    const middle = open < 0 ? -1 : line.indexOf("](", open + 1);
    const close = middle < 0 ? -1 : line.indexOf(")", middle + 2);
    if (close < 0) return result + line.slice(from);
    result += line.slice(from, open) + line.slice(open + 1, middle);
    from = close + 1;
  }
};

/**
 * 將文字（可能含 Markdown 語法）去除連結與標記符號後，壓成單行純文字摘要。
 * @param {string} text 原始文字，可能含 Markdown 語法
 * @param {number} [maxLength=160] 摘要最大字元數
 * @returns {string} 去除 Markdown 語法並裁切長度後的純文字摘要
 */
export const toPlainTextExcerpt = (text, maxLength = 160) => {
  if (!text) return "";

  // 先去除連結語法再壓成純文字與固定長度，避免摘要帶有 Markdown 雜訊影響可讀性。
  /** @param {string} value */
  const stripMarkdownLinks = (value) =>
    value
      .split(/([\n\r\u2028\u2029])/)
      .map(stripLineLinks)
      .join("");

  return (
    stripMarkdownLinks(text)
      // 文章中允許直接寫 HTML（表格容器、figure、img），沒有先剝掉的話，
      // 缺 description 時自動摘要會把 <div class="table-wrapper" …> 整串塞進 meta 與 RSS。
      .replace(/<[^<>]*>/g, " ") // HTML 標籤
      .replace(/`([^`]*)`/g, "$1") // 行內程式碼
      .replace(/^[ \t]*#+\s*/gm, "") // 標題標記
      .replace(/^[ \t]*>\s*/gm, "") // 引用標記
      .replace(/^[ \t]*[-*]\s+/gm, "") // 項目符號（僅限行首，避免誤刪文字中的連字號）
      .replace(/\*\*(.*?)\*\*/g, "$1") // 粗體
      .replace(/\*(.*?)\*/g, "$1") // 斜體
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, maxLength)
  );
};
