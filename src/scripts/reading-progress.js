/** @type {(() => void) | undefined} */
let dispose;

export function cleanupReadingProgress() {
  dispose?.();
  dispose = undefined;
}

export function initReadingProgress() {
  cleanupReadingProgress();
  const bar = document.querySelector(".reading-progress");
  const fill = bar?.querySelector("span");
  const article = document.querySelector(".reading-article");
  const content = article?.querySelector(".prose");
  const header = document.querySelector(".site-header");
  if (
    !(bar instanceof HTMLElement) ||
    !(fill instanceof HTMLElement) ||
    !article ||
    !content
  )
    return;

  const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let frame = 0;
  /** @type {AbortController | undefined} */
  let events;
  /** @type {ResizeObserver | undefined} */
  let observer;

  const update = () => {
    frame = 0;
    const start = Math.max(
      0,
      article.getBoundingClientRect().top +
        window.scrollY -
        (header?.getBoundingClientRect().height ?? 0),
    );
    const end =
      content.getBoundingClientRect().bottom +
      window.scrollY -
      window.innerHeight;
    const progress =
      end > start
        ? (window.scrollY - start) / (end - start)
        : window.scrollY >= end
          ? 1
          : 0;
    fill.style.transform = `scaleX(${Math.min(1, Math.max(0, progress))})`;
  };

  const schedule = () => {
    if (!frame) frame = requestAnimationFrame(update);
  };

  const stop = () => {
    events?.abort();
    observer?.disconnect();
    cancelAnimationFrame(frame);
    frame = 0;
    bar.hidden = true;
  };

  const syncMotion = () => {
    stop();
    if (motion.matches) return;
    events = new AbortController();
    window.addEventListener("scroll", schedule, {
      passive: true,
      signal: events.signal,
    });
    window.addEventListener("resize", schedule, { signal: events.signal });
    if ("ResizeObserver" in window) {
      observer = new ResizeObserver(schedule);
      observer.observe(article);
    }
    bar.hidden = false;
    schedule();
  };

  motion.addEventListener("change", syncMotion);
  dispose = () => {
    stop();
    motion.removeEventListener("change", syncMotion);
  };
  syncMotion();
}
