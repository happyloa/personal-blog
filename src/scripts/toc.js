/** @type {IntersectionObserver | undefined} */
let headingObserver;

export function cleanupTOC() {
  headingObserver?.disconnect();
  headingObserver = undefined;
}

export function initTOC() {
  cleanupTOC();
  const links = document.querySelectorAll(".toc-link");
  const headings = document.querySelectorAll("article h2[id], article h3[id]");
  // The native details and anchor navigation work without this enhancement.
  if (!links.length || !headings.length || !("IntersectionObserver" in window))
    return;
  headingObserver = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        for (const link of links) {
          if (link.getAttribute("data-slug") === entry.target.id)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        }
      }
    },
    { rootMargin: "-15% 0px -65% 0px", threshold: 0 },
  );
  headings.forEach((heading) => headingObserver?.observe(heading));
}
