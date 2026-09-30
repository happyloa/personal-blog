// 這兩個都保存在模組層：ClientRouter 換頁時 initTOC 會重跑，若不先清掉舊的，
// 監聽器會在 document 上層層疊加，observer 也會連同整份舊 DOM 一起被留住。
/** @type {((event: KeyboardEvent) => void) | undefined} */
let tocKeydownHandler;
/** @type {((event: FocusEvent) => void) | undefined} */
let tocFocusoutHandler;
/** @type {IntersectionObserver | undefined} */
let headingObserver;

export function initTOC() {
  // 清理必須在 early return 之前：換到沒有目錄的頁面（首頁、分類頁）時，
  // 舊頁面的監聽器與 observer 同樣要斷乾淨。
  headingObserver?.disconnect();
  headingObserver = undefined;

  if (tocKeydownHandler) {
    document.removeEventListener("keydown", tocKeydownHandler);
    tocKeydownHandler = undefined;
  }
  if (tocFocusoutHandler) {
    document.removeEventListener("focusout", tocFocusoutHandler);
    tocFocusoutHandler = undefined;
  }

  const tocMobile = document.getElementById("toc-mobile");
  const tocOverlay = document.getElementById("toc-overlay");
  const tocFab = document.getElementById("toc-fab");
  const links = document.querySelectorAll(".toc-link, .toc-link-mobile");
  const headings = document.querySelectorAll("article h2[id], article h3[id]");

  if (!links.length || !headings.length) return;

  let isOpen = false;

  /** @param {boolean} nextOpen */
  function setMobileOpen(nextOpen, { returnFocus = true } = {}) {
    isOpen = nextOpen;
    tocFab?.setAttribute("aria-expanded", String(isOpen));
    tocMobile?.setAttribute("aria-hidden", String(!isOpen));
    // 關閉時用 inert 讓面板內連結整體退出 Tab 順序與無障礙樹，避免與 aria-hidden 衝突。
    tocMobile?.toggleAttribute("inert", !isOpen);
    tocMobile?.classList.toggle("opacity-100", isOpen);
    tocMobile?.classList.toggle("pointer-events-auto", isOpen);
    tocMobile?.classList.toggle("opacity-0", !isOpen);
    tocMobile?.classList.toggle("pointer-events-none", !isOpen);
    tocOverlay?.setAttribute("aria-hidden", String(!isOpen));
    tocOverlay?.toggleAttribute("inert", !isOpen);
    tocOverlay?.classList.toggle("opacity-100", isOpen);
    tocOverlay?.classList.toggle("pointer-events-auto", isOpen);
    tocOverlay?.classList.toggle("opacity-0", !isOpen);
    tocOverlay?.classList.toggle("pointer-events-none", !isOpen);

    if (isOpen) {
      // 開啟時將焦點移入面板，讓鍵盤與螢幕報讀使用者能直接操作目錄。
      tocMobile?.querySelector("a")?.focus();
    } else if (returnFocus) {
      // 關閉時把焦點還給觸發按鈕。
      tocFab?.focus();
    }
  }

  /** @param {string} slug */
  function setActiveLink(slug) {
    links.forEach((link) => {
      const isActive = link.getAttribute("data-slug") === slug;
      link.classList.toggle("bg-surface-soft", isActive);
      link.classList.toggle("text-slate-100", isActive);
      link.classList.toggle("text-slate-400", !isActive);
      if (isActive) {
        link.setAttribute("aria-current", "true");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  tocFab?.addEventListener("click", () => setMobileOpen(!isOpen));
  tocOverlay?.addEventListener("click", () => setMobileOpen(false));

  document.querySelectorAll(".toc-link-mobile").forEach((link) => {
    link.addEventListener("click", () =>
      setMobileOpen(false, { returnFocus: false }),
    );
  });

  // Escape 關閉面板。這是 disclosure（aria-expanded + aria-controls），不是 modal dialog，
  // 所以刻意不做 Tab 循環攔截——那會把鍵盤使用者困在目錄裡，而唯一的關閉按鈕（FAB）
  // 還在面板之外、不在循環內。
  tocKeydownHandler = (event) => {
    if (isOpen && event.key === "Escape") {
      setMobileOpen(false);
    }
  };
  document.addEventListener("keydown", tocKeydownHandler);

  // 焦點離開面板（且不是移到 FAB）時自動收合，讓 Tab 能自然地往下走，
  // 同時不會留下一個看不見卻仍在 Tab 順序裡的面板。
  tocFocusoutHandler = (event) => {
    if (!isOpen || !tocMobile) return;
    const next = event.relatedTarget;
    if (next instanceof Node && (tocMobile.contains(next) || next === tocFab))
      return;
    setMobileOpen(false, { returnFocus: false });
  };
  document.addEventListener("focusout", tocFocusoutHandler);

  headingObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveLink(entry.target.id);
        }
      });
    },
    { rootMargin: "-20% 0px -70% 0px", threshold: 0 },
  );

  headings.forEach((heading) => headingObserver?.observe(heading));

  // 讓 DOM 與 isOpen 從一開始就同步（SSR 已輸出 inert / aria-hidden，這裡不搶焦點）。
  setMobileOpen(false, { returnFocus: false });
}
