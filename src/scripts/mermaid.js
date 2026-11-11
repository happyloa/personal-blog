// mermaid 圖表類型 → 中文名稱。用來給容器一個有意義的 aria-label，
// 而不是不管畫什麼都朗讀成「流程圖」。
/** @type {Record<string, string>} */
const DIAGRAM_LABELS = {
  flowchart: "流程圖",
  graph: "流程圖",
  sequenceDiagram: "循序圖",
  classDiagram: "類別圖",
  stateDiagram: "狀態圖",
  "stateDiagram-v2": "狀態圖",
  erDiagram: "實體關聯圖",
  journey: "使用者旅程圖",
  gantt: "甘特圖",
  pie: "圓餅圖",
  mindmap: "心智圖",
  timeline: "時間軸",
  gitGraph: "Git 線圖",
};

/** @param {string} source */
function labelFor(source) {
  const keyword = /^\s*([A-Za-z][\w-]*)/.exec(source)?.[1] ?? "";
  return DIAGRAM_LABELS[keyword] ?? "圖表";
}

// 將 ```mermaid 圍欄產生的 <pre data-language="mermaid"> 轉成 mermaid 容器。
// 直接用 Shiki 標好的屬性選取，不必比對內容開頭關鍵字，因此不會誤判一般程式碼範例，
// 也自動支援 journey / mindmap / timeline 等所有圖表類型。
/** @param {HTMLPreElement} pre */
function prepareMermaidBlock(pre) {
  const source = pre.textContent.trim();

  const shell = document.createElement("div");
  shell.className = "mermaid-shell";
  // 圖表可能比容器寬，容器會水平捲動；沒有 tabindex 的話純鍵盤使用者看不到右側被截掉的部分。
  shell.tabIndex = 0;
  shell.setAttribute("role", "group");
  shell.setAttribute("aria-label", labelFor(source));

  // 先用原始碼區塊的高度撐住版面，等 SVG 算完再放開，避免圖以下的內容連續位移兩次。
  const height = pre.getBoundingClientRect().height;
  if (height) shell.style.minHeight = `${height}px`;

  const diagram = document.createElement("div");
  diagram.className = "mermaid";
  diagram.textContent = source;

  // 保留原始碼：mermaid 產生的 SVG 對螢幕閱讀器幾乎沒有意義，留一份可展開的純文字版本。
  const details = document.createElement("details");
  details.className = "mermaid-source";
  const summary = document.createElement("summary");
  summary.textContent = "圖表原始碼";
  details.append(summary, pre.cloneNode(true));

  shell.append(diagram, details);
  pre.replaceWith(shell);
  return { shell, diagram };
}

// 只在頁面確實有圖時才動態載入 mermaid，並只初始化一次。
// 下載量依版本與圖表類型而異，升級後需重新量測瀏覽器的網路請求。
// mermaid 內部各圖表類型與 katex／cytoscape 都是動態 import，用不到的類型不會下載。
// 套件為專案自架（package.json 的 mermaid），Vite 會切成帶 hash 的獨立 chunk：
// 「有圖才下載」的行為不變，但不再依賴第三方 CDN，CSP 也才能收回 script-src 'self'。
/** @type {Promise<import("mermaid").Mermaid> | undefined} */
let mermaidReady;

// 沿用內文解析後的字型堆疊。Astro Fonts 產生的字型名稱帶雜湊（例如 Inter-df3e…），
// 寫死 "Inter" 對不到任何 @font-face，圖表文字會退回系統字型。
const bodyFontFamily = () => getComputedStyle(document.body).fontFamily;

function loadMermaid() {
  mermaidReady ??= import("mermaid").then(({ default: mermaid }) => {
    mermaid.initialize({
      startOnLoad: false,
      theme: "base",
      // 設在頂層：initialize() 會同步到 themeVariables，循序圖量測文字時也讀這個值。
      fontFamily: bodyFontFamily(),
      // 使用 Dagre，避免一般流程圖下載大型 ELK 排版程式。
      layout: "dagre",
      flowchart: {
        theme: "base",
        look: "classic",
        // 保留文字大小；寬圖表由外層容器水平捲動。
        useMaxWidth: false,
      },
      themeVariables: {
        darkMode: true,
        background: "#252620",
        primaryColor: "#2d2e29",
        primaryTextColor: "#eeeee5",
        primaryBorderColor: "#ff8068",
        lineColor: "#b0b1a5",
        secondaryColor: "#252620",
        tertiaryColor: "#181917",
        secondaryTextColor: "#eeeee5",
        tertiaryTextColor: "#eeeee5",
        edgeLabelBackground: "#181917",
      },
    });
    return mermaid;
  });
  return mermaidReady;
}

/** @type {IntersectionObserver | undefined} */
let observer;
let pageGeneration = 0;
let renderQueue = Promise.resolve();

export function cleanupMermaid() {
  observer?.disconnect();
  observer = undefined;
  pageGeneration += 1;
}

/** @param {HTMLPreElement} pre @param {number} generation */
async function renderBlock(pre, generation) {
  if (generation !== pageGeneration || !pre.isConnected) return;
  /** @type {HTMLDivElement | undefined} */
  let shell;

  try {
    const mermaid = await loadMermaid();
    // Mermaid 依當下的字型量測節點大小；字型晚到會讓文字超出節點框，因此先載入這張圖用到的字。
    await document.fonts
      .load(`1em ${bodyFontFamily()}`, pre.textContent)
      .catch(() => {});
    // 載入期間可能已換頁，不能把舊頁的圖表插進新頁。
    if (generation !== pageGeneration || !pre.isConnected) return;
    const block = prepareMermaidBlock(pre);
    shell = block.shell;
    // suppressErrors 讓單一張圖的語法錯誤不會中斷同頁其他圖表的渲染。
    await mermaid.run({
      nodes: [block.diagram],
      suppressErrors: true,
    });
  } catch (error) {
    // chunk 載入失敗或初始化拋錯時清掉快取，讓下次換頁還有機會重試。
    mermaidReady = undefined;
    console.error("[mermaid] 圖表初始化失敗", error);
  } finally {
    if (shell) shell.style.minHeight = "";
  }
}

export function initMermaid() {
  cleanupMermaid();
  const generation = pageGeneration;
  const blocks = document.querySelectorAll(
    'pre[data-language="mermaid"]:not(.mermaid-source pre)',
  );

  /** @param {HTMLPreElement} pre */
  const scheduleRender = (pre) => {
    if (!pre.textContent.trim()) return;
    // Mermaid 共用渲染狀態，逐張處理，避免同時產生 SVG 時互相干擾。
    renderQueue = renderQueue.then(() => renderBlock(pre, generation));
  };

  if (!("IntersectionObserver" in window)) {
    blocks.forEach((pre) => {
      if (pre instanceof HTMLPreElement) scheduleRender(pre);
    });
    return;
  }
  if (blocks.length === 0) return;

  // 接近畫面才下載圖表程式；載入期間保留原始程式碼，讓內容仍可閱讀。
  observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (!isIntersecting || !(target instanceof HTMLPreElement)) return;
        observer?.unobserve(target);
        scheduleRender(target);
      });
    },
    { rootMargin: "600px" },
  );
  blocks.forEach((pre) => observer?.observe(pre));
}
