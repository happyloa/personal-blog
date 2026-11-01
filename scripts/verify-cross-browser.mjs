import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

const moduleRoot = process.env.PLAYWRIGHT_MODULE_ROOT;
if (!moduleRoot)
  throw new Error(
    "Set PLAYWRIGHT_MODULE_ROOT to an existing playwright-core package directory with matching browser binaries.",
  );
const { firefox, webkit } = await import(
  pathToFileURL(join(moduleRoot, "index.mjs")).href
);
const origin = process.argv[2] ?? "http://127.0.0.1:4323";
const out = resolve(".lighthouse/cross-browser");
await mkdir(out, { recursive: true });
/** @type {Record<string, unknown>[]} */
const results = [];
for (const [name, launcher] of [
  ["firefox", firefox],
  ["webkit", webkit],
]) {
  const browser = await launcher.launch({ headless: true });
  try {
    for (const width of [390, 768, 1440]) {
      const context = await browser.newContext({
        viewport: { width, height: 900 },
      });
      const page = await context.newPage();
      /** @type {string[]} */
      const errors = [];
      page.on("pageerror", (/** @type {Error} */ error) =>
        errors.push(error.message),
      );
      for (const path of [
        "/",
        "/posts/",
        "/posts/page/2/",
        "/categories/",
        "/posts/database-systems-comparison/",
      ]) {
        await page.goto(origin + path, { waitUntil: "networkidle" });
        const layout = await page.evaluate(() => ({
          width: innerWidth,
          scrollWidth: Math.max(
            document.body.scrollWidth,
            document.documentElement.scrollWidth,
          ),
          h1: document.querySelectorAll("h1").length,
        }));
        assert.ok(
          layout.scrollWidth <= layout.width + 1,
          `${name} ${width} ${path} ${JSON.stringify(layout)}`,
        );
        assert.equal(layout.h1, 1);
      }
      assert.deepEqual(errors, []);
      results.push({
        browser: name,
        version: browser.version(),
        width,
        check: "five-page responsive layout, one h1, no script errors",
      });
      console.log(`PASS ${name} ${width}px × 5 pages`);
      await context.close();
    }
    const noJS = await browser.newContext({
      viewport: { width: 390, height: 844 },
      javaScriptEnabled: false,
    });
    const page = await noJS.newPage();
    await page.goto(origin + "/posts/", { waitUntil: "networkidle" });
    await page.locator('.pagination a[rel="next"]').click();
    await page.waitForURL(origin + "/posts/page/2/");
    assert.equal(await page.locator("[data-post-id]").count(), 12);
    await page.goto(origin + "/posts/database-systems-comparison/", {
      waitUntil: "networkidle",
    });
    await page.locator(".toc-mobile summary").click();
    assert.equal(await page.locator(".toc-mobile").getAttribute("open"), "");
    await page.locator(".toc-mobile a").first().click();
    assert.ok(new URL(page.url()).hash);
    results.push({
      browser: name,
      check: "no JavaScript: pagination and native details/anchor navigation",
    });
    console.log(`PASS ${name} no-JS pagination and TOC`);
    await noJS.close();
    const diagrams = await browser.newContext({
      viewport: { width: 390, height: 844 },
      reducedMotion: "reduce",
    });
    const diagramPage = await diagrams.newPage();
    await diagramPage.goto(origin + "/posts/how-browser-renders-webpage/", {
      waitUntil: "networkidle",
    });
    await diagramPage
      .locator('pre[data-language="mermaid"]')
      .first()
      .scrollIntoViewIfNeeded();
    await diagramPage
      .locator(".mermaid svg")
      .first()
      .waitFor({ timeout: 60000 });
    assert.ok(await diagramPage.locator(".mermaid-source pre").count());
    assert.equal(
      await diagramPage.evaluate(
        () => getComputedStyle(document.documentElement).scrollBehavior,
      ),
      "auto",
    );
    await diagramPage.locator('.primary-nav a[href="/posts/"]').click();
    await diagramPage.waitForURL(origin + "/posts/");
    await diagramPage.locator('.pagination a[rel="next"]').click();
    await diagramPage.waitForURL(origin + "/posts/page/2/");
    await diagramPage
      .locator('.post-title[href="/posts/how-browser-renders-webpage/"]')
      .click();
    await diagramPage.waitForURL(
      origin + "/posts/how-browser-renders-webpage/",
    );
    await diagramPage
      .locator('pre[data-language="mermaid"]')
      .first()
      .scrollIntoViewIfNeeded();
    await diagramPage
      .locator(".mermaid svg")
      .first()
      .waitFor({ timeout: 60000 });
    assert.equal(
      await diagramPage.locator(".mermaid-shell .mermaid-shell").count(),
      0,
    );
    results.push({
      browser: name,
      check:
        "lazy Mermaid, preserved source, reduced motion and ClientRouter diagram re-entry",
    });
    console.log(`PASS ${name} Mermaid and reduced motion`);
    await diagrams.close();
  } finally {
    await browser.close();
    await writeFile(
      join(out, "results.json"),
      JSON.stringify(results, null, 2),
    );
  }
}
