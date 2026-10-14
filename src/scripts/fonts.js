// 不讓外部中文字型的樣式表阻塞內容繪製；載入失敗時繼續使用系統字型。
export function initFonts() {
  const stylesheet = document.querySelector("link#cjk-fonts");
  if (!(stylesheet instanceof HTMLLinkElement) || stylesheet.media === "all") {
    return;
  }

  const applyFonts = () => {
    // 即使 CSS 已在快取中，也先讓瀏覽器繪製內容，避免字型載入搶在首次繪製前。
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        stylesheet.media = "all";
      });
    });
  };

  // 快取可能讓 load 事件早於模組執行，這時直接套用已載入的樣式表。
  if (stylesheet.sheet) applyFonts();
  else stylesheet.addEventListener("load", applyFonts, { once: true });
}
