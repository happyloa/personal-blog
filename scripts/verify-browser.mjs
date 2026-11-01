import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const moduleRoot = process.env.LIGHTHOUSE_MODULE_ROOT;
if (!moduleRoot)
  throw new Error(
    "Set LIGHTHOUSE_MODULE_ROOT to the Lighthouse node_modules directory.",
  );
const { default: puppeteer } = await import(
  pathToFileURL(
    join(moduleRoot, "puppeteer-core/lib/puppeteer/puppeteer-core.js"),
  ).href
);
const origin = process.argv[2] ?? "http://127.0.0.1:4323";
const out = resolve(".lighthouse/browser");
const screenshots = resolve(".lighthouse/screenshots");
await mkdir(out, { recursive: true });
await mkdir(screenshots, { recursive: true });
/** @type {Record<string, unknown>[]} */
const results = [];
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
});
const record = (
  /** @type {string} */ name,
  /** @type {unknown} */ detail = true,
) => {
  results.push({ name, detail });
  console.log(`PASS ${name}`);
};
/** @param {any} page */
const assertNoOverflow = async (page) => {
  const widths = await page.evaluate(() => ({
    viewport: innerWidth,
    body: document.body.scrollWidth,
    document: document.documentElement.scrollWidth,
  }));
  assert.ok(
    Math.max(widths.body, widths.document) <= widths.viewport + 1,
    JSON.stringify(widths),
  );
};
/** @param {any} page @param {string} path */
const navigate = async (page, path) => {
  await page.goto(origin + path, { waitUntil: "networkidle0" });
};
/** @param {any} page */
const finishTransition = async (page) => {
  await page.evaluate(async () => {
    await Promise.all(
      document
        .getAnimations()
        .map((animation) => animation.finished.catch(() => {})),
    );
  });
};
try {
  const page = await browser.newPage();
  /** @type {string[]} */
  const errors = [];
  page.on("pageerror", (/** @type {Error} */ error) =>
    errors.push(error.message),
  );
  page.on("console", (/** @type {any} */ message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  const paths = [
    "/",
    "/posts/",
    "/posts/page/2/",
    "/categories/",
    "/categories/mindset/",
    "/posts/database-systems-comparison/",
    "/404.html",
  ];
  for (const width of [360, 390, 768, 1024, 1280, 1440]) {
    await page.setViewport({ width, height: 900 });
    for (const path of paths) {
      await navigate(page, path);
      await assertNoOverflow(page);
      assert.equal(
        await page.$$eval(
          "h1",
          (/** @type {Element[]} */ nodes) => nodes.length,
        ),
        1,
      );
      if (path.includes("database-systems")) {
        const toc = await page.evaluate(() => {
          const desktop = document.querySelector(".toc-desktop");
          const mobile = document.querySelector(".toc-mobile");
          if (!desktop || !mobile) throw new Error("Missing TOC");
          return {
            desktop: getComputedStyle(desktop).display,
            mobile: getComputedStyle(mobile).display,
            position: getComputedStyle(desktop).position,
          };
        });
        assert.equal(toc.desktop === "none", width < 1280);
        assert.equal(toc.mobile === "none", width >= 1280);
        if (width >= 1280) assert.equal(toc.position, "sticky");
      }
    }
    record(`responsive ${width}px × ${paths.length} pages`);
  }
  for (const [label, path] of [
    ["home", "/"],
    ["archive", "/posts/"],
    ["article", "/posts/database-systems-comparison/"],
  ]) {
    for (const width of [390, 1440]) {
      await page.setViewport({ width, height: 1000 });
      await navigate(page, path);
      if (label === "article" && width === 390)
        await page.click(".toc-mobile summary");
      await page.screenshot({
        path: join(screenshots, `${label}-${width}.png`),
        fullPage: label !== "article",
      });
    }
  }
  record("six desktop/mobile review screenshots");
  await page.setViewport({ width: 390, height: 844 });
  await navigate(page, "/posts/");
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("href")),
    "#main-content",
  );
  await page.keyboard.press("Enter");
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "main-content",
  );
  await page.keyboard.down("Shift");
  await page.keyboard.press("Tab");
  await page.keyboard.up("Shift");
  await page.keyboard.press("Tab");
  record("keyboard skip link and reverse tab");
  await navigate(page, "/posts/database-systems-comparison/");
  await page.focus(".toc-mobile summary");
  await page.keyboard.press("Enter");
  assert.ok(
    await page.$eval(
      ".toc-mobile",
      (/** @type {HTMLDetailsElement} */ details) => details.open,
    ),
  );
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  assert.ok(await page.evaluate(() => Boolean(location.hash)));
  await page.keyboard.press("Escape");
  await page.keyboard.press("Tab");
  record("native mobile TOC keyboard expansion and anchor navigation");
  await page.evaluate(() => {
    const pre = document.querySelector(".prose pre");
    if (pre instanceof HTMLElement) {
      pre.textContent = "long-code-".repeat(150);
      pre.focus();
    }
  });
  await page.keyboard.press("ArrowRight");
  await page.waitForFunction(
    () => (document.querySelector(".prose pre")?.scrollLeft ?? 0) > 0,
  );
  await page.keyboard.press("End");
  assert.ok(
    await page.$eval(
      ".prose pre",
      (/** @type {HTMLElement} */ pre) => pre.scrollWidth > pre.clientWidth,
    ),
  );
  assert.equal(
    await page.$eval(
      ".prose pre",
      (/** @type {HTMLElement} */ pre) => getComputedStyle(pre).outlineStyle,
    ),
    "solid",
  );
  await assertNoOverflow(page);
  record("long code stays in keyboard-focusable horizontal scroller");
  await page.setViewport({ width: 720, height: 450, deviceScaleFactor: 2 });
  for (const path of paths) {
    await navigate(page, path);
    await assertNoOverflow(page);
  }
  record(
    "200% zoom equivalent: 1440px screen with 720px CSS viewport and DPR 2",
  );
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1 });
  await navigate(page, "/posts/");
  await page.evaluate(() => {
    document.querySelectorAll(".post-title, .post-summary").forEach((node) => {
      node.textContent = "VeryLongUnbrokenTitle".repeat(25);
    });
  });
  await assertNoOverflow(page);
  record("long unbroken title/summary stress");
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: "reduce" },
  ]);
  await navigate(page, "/");
  assert.equal(
    await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollBehavior,
    ),
    "auto",
  );
  assert.equal(await page.$("canvas"), null);
  record("reduced motion and static background");
  await page.emulateMediaFeatures([]);
  const cdp = await page.createCDPSession();
  await cdp.send("Emulation.setEmulatedMedia", {
    features: [{ name: "forced-colors", value: "active" }],
  });
  await navigate(page, "/posts/");
  await page.focus(".post-title");
  assert.equal(
    await page.$eval(
      ".post-row",
      (/** @type {Element} */ node) => getComputedStyle(node).outlineStyle,
    ),
    "solid",
  );
  record("forced colors focus outline");
  await cdp.send("Emulation.setEmulatedMedia", { features: [] });
  const noJS = await browser.newPage();
  await noJS.setViewport({ width: 390, height: 844 });
  await noJS.setJavaScriptEnabled(false);
  await navigate(noJS, "/posts/");
  await Promise.all([
    noJS.waitForNavigation({ waitUntil: "networkidle0" }),
    noJS.click('.pagination a[rel="next"]'),
  ]);
  assert.equal(new URL(noJS.url()).pathname, "/posts/page/2/");
  assert.equal(
    await noJS.$$eval(
      "[data-post-id]",
      (/** @type {Element[]} */ nodes) => nodes.length,
    ),
    12,
  );
  await navigate(noJS, "/posts/database-systems-comparison/");
  await noJS.click(".toc-mobile summary");
  assert.ok(
    await noJS.$eval(
      ".toc-mobile",
      (/** @type {HTMLDetailsElement} */ details) => details.open,
    ),
  );
  await noJS.click(".toc-mobile a");
  assert.ok(new URL(noJS.url()).hash);
  await assertNoOverflow(noJS);
  record("JavaScript disabled: static pagination, article and native TOC");
  await noJS.close();
  const fallback = await browser.newPage();
  await fallback.setViewport({ width: 390, height: 844 });
  await fallback.evaluateOnNewDocument(() => {
    Reflect.deleteProperty(window, "IntersectionObserver");
  });
  await fallback.setRequestInterception(true);
  fallback.on("request", (/** @type {any} */ request) => {
    if (/fonts\.(googleapis|gstatic)\.com|\.woff2(?:\?|$)/.test(request.url()))
      void request.abort();
    else void request.continue();
  });
  await navigate(fallback, "/posts/how-the-internet-works/");
  await fallback.waitForSelector(".mermaid svg", { timeout: 60000 });
  await fallback.waitForFunction(
    () =>
      document.querySelectorAll(".mermaid svg").length ===
      document.querySelectorAll('pre[data-language="mermaid"]').length,
    { timeout: 60000 },
  );
  await fallback.click(".toc-mobile summary");
  assert.ok(await fallback.$(".toc-mobile a"));
  await assertNoOverflow(fallback);
  record(
    "font network failure + no IntersectionObserver: readable article, TOC and Mermaid fallback",
  );
  await fallback.close();
  const blockedDiagram = await browser.newPage();
  await blockedDiagram.setRequestInterception(true);
  blockedDiagram.on("request", (/** @type {any} */ request) => {
    if (request.resourceType() === "script" && /mermaid/.test(request.url()))
      void request.abort();
    else void request.continue();
  });
  await navigate(blockedDiagram, "/posts/how-the-internet-works/");
  assert.ok(await blockedDiagram.$('pre[data-language="mermaid"]'));
  assert.equal(await blockedDiagram.$(".mermaid svg"), null);
  record("blocked Mermaid chunk preserves readable source");
  await blockedDiagram.close();
  await page.setViewport({ width: 1280, height: 900 });
  await navigate(page, "/");
  const requests = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((entry) => entry.name),
  );
  assert.ok(
    !requests.some((/** @type {string} */ url) =>
      /mermaid|flowDiagram|dagre/.test(url),
    ),
  );
  record("no eager Mermaid chunks on homepage");
  await navigate(page, "/posts/how-browser-renders-webpage/");
  await page.$eval(
    'pre[data-language="mermaid"]',
    (/** @type {Element} */ pre) => pre.scrollIntoView(),
  );
  await page.waitForSelector(".mermaid svg", { timeout: 60000 });
  assert.ok(await page.$(".mermaid-source pre"));
  await page.click(".mermaid-source summary");
  record("lazy Mermaid render and expandable original source");
  for (let iteration = 0; iteration < 3; iteration++) {
    await page.click('.primary-nav a[href="/posts/"]');
    await page.waitForFunction(() => location.pathname === "/posts/");
    await finishTransition(page);
    await page.click('.post-title[href="/posts/database-systems-comparison/"]');
    await page.waitForFunction(
      () => location.pathname === "/posts/database-systems-comparison/",
    );
    await finishTransition(page);
    await page.$eval("article h2[id]", (/** @type {Element} */ heading) =>
      heading.scrollIntoView(),
    );
    await page.waitForSelector('.toc-link[aria-current="location"]');
  }
  record(
    "ClientRouter repeated archive/article navigation and TOC reinitialization",
  );
  const response = await page.goto(
    origin + "/definitely-missing-redesign-page/",
    { waitUntil: "networkidle0" },
  );
  assert.equal(response.status(), 404);
  assert.ok(await page.$('meta[name="robots"][content="noindex, follow"]'));
  record("unknown URL returns noindex 404");
  // The deliberate 404 creates a resource error; all other console/page errors are failures.
  const unexpected = errors.filter((error) => !/404 \(Not Found\)/.test(error));
  assert.deepEqual(unexpected, []);
  record("no unexpected browser exceptions or CSP errors");
} catch (error) {
  for (const page of await browser.pages()) {
    console.error("Failure page:", page.url());
    await page.screenshot({ path: join(out, "failure.png") }).catch(() => {});
  }
  throw error;
} finally {
  await writeFile(
    join(out, "results.json"),
    JSON.stringify({ browser: await browser.version(), results }, null, 2),
  );
  await browser.close();
}
