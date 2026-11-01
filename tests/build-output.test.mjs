import assert from "node:assert/strict";
import test from "node:test";
import { readdir, readFile, access } from "node:fs/promises";
import { join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { parse } from "node-html-parser";
import { categories } from "../src/utils/categories.js";

// Use the same frontmatter parser as the installed Astro loader, including YAML dates/drafts.
const require = createRequire(import.meta.url);
const astroRequire = createRequire(require.resolve("astro/package.json"));
const { parseFrontmatter } = await import(
  pathToFileURL(astroRequire.resolve("@astrojs/internal-helpers/frontmatter"))
    .href
);
const origin = "https://blog.worksbyaaron.com";
const dist = resolve("dist");
const sources = await Promise.all(
  (await readdir("src/content/posts"))
    .filter((file) => file.endsWith(".md"))
    .map(async (file) => {
      const { frontmatter } = parseFrontmatter(
        await readFile(join("src/content/posts", file), "utf8"),
      );
      return { id: file.slice(0, -3), ...frontmatter };
    }),
);
const published = sources
  .filter((post) => !post.draft)
  .sort(
    (a, b) =>
      new Date(b.date).getTime() - new Date(a.date).getTime() ||
      (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
  );
const files = (await readdir(dist, { recursive: true })).filter((file) =>
  file.endsWith(".html"),
);
const pages = new Map(
  await Promise.all(
    files.map(
      async (file) =>
        /** @type {[string, import("node-html-parser").HTMLElement]} */ ([
          file.replaceAll("\\", "/"),
          parse(await readFile(join(dist, file), "utf8")),
        ]),
    ),
  ),
);
const sitemap = parse(await readFile(join(dist, "sitemap-0.xml"), "utf8"));
const rss = await readFile(join(dist, "rss.xml"), "utf8");
const sitemapURLs = sitemap
  .querySelectorAll("url > loc")
  .map((loc) => loc.text);
// HTML parsers treat <link> as a void element; RSS needs XML closing-tag semantics.
const rssURLs = Array.from(
  rss.matchAll(/<item>[\s\S]*?<link>([^<]*)<\/link>/g),
  (match) => match[1],
);
const themeCSS = await readFile("src/styles/global.css", "utf8");

test("reading text, code tokens and focus colors meet WCAG AA contrast", () => {
  const colors = Object.fromEntries(
    Array.from(
      themeCSS.matchAll(/--color-([\w-]+):\s*(#[\da-f]{6});/gi),
      (match) => [match[1], match[2]],
    ),
  );
  /** @param {string} color */
  const luminance = (color) => {
    const channels = [1, 3, 5]
      .map((offset) => parseInt(color.slice(offset, offset + 2), 16) / 255)
      .map((value) =>
        value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
      );
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  };
  /** @param {string} foreground @param {string} background */
  const contrast = (foreground, background) => {
    const values = [luminance(foreground), luminance(background)].sort(
      (a, b) => b - a,
    );
    return (values[0] + 0.05) / (values[1] + 0.05);
  };
  for (const background of ["base", "surface", "surface-soft"]) {
    for (const foreground of [
      "ink",
      "ink-secondary",
      "muted",
      "primary",
      "primary-muted",
    ])
      assert.ok(
        contrast(colors[foreground], colors[background]) >= 4.5,
        `${foreground} on ${background}`,
      );
    assert.ok(
      contrast(colors.primary, colors[background]) >= 3,
      `Focus on ${background}`,
    );
  }
  for (const page of pages.values()) {
    for (const span of page.querySelectorAll(".prose pre span[style]")) {
      const color = /(?:^|;)\s*color:\s*(#[\da-f]{6})/i.exec(
        span.getAttribute("style") ?? "",
      )?.[1];
      if (color)
        assert.ok(
          contrast(color, colors["code-surface"]) >= 4.5,
          `Shiki ${color} on code surface`,
        );
    }
  }
});
/** @param {string} pathname */
const outputFile = (pathname) =>
  pathname.endsWith("/") ? pathname.slice(1) + "index.html" : pathname.slice(1);
/** @param {import("node-html-parser").HTMLElement} page */
const schemas = (page) =>
  page
    .querySelectorAll('script[type="application/ld+json"]')
    .flatMap((script) => {
      const schema = JSON.parse(script.text);
      return schema["@graph"] ?? [schema];
    });

test("all Markdown article URLs, metadata, drafts, RSS and sitemap remain consistent", async () => {
  for (const post of sources) {
    const url = `${origin}/posts/${post.id}/`;
    const page = pages.get(`posts/${post.id}/index.html`);
    if (post.draft) {
      assert.equal(page, undefined, `Draft leaked: ${post.id}`);
      assert.ok(!rssURLs.includes(url));
      assert.ok(!sitemapURLs.includes(url));
      continue;
    }
    assert.ok(page, `Missing article: ${post.id}`);
    assert.equal(
      page.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      url,
    );
    assert.equal(page.querySelector("h1")?.text.trim(), post.title);
    assert.ok(rssURLs.includes(url), `RSS missing ${url}`);
    assert.ok(sitemapURLs.includes(url), `Sitemap missing ${url}`);
    const posting = schemas(page).find(
      (schema) => schema["@type"] === "BlogPosting",
    );
    const breadcrumb = schemas(page).find(
      (schema) => schema["@type"] === "BreadcrumbList",
    );
    assert.ok(posting && breadcrumb, post.id);
    assert.equal(posting.mainEntityOfPage, url);
    assert.equal(posting.datePublished, new Date(post.date).toISOString());
    assert.equal(
      posting.dateModified,
      new Date(post.updated ?? post.date).toISOString(),
    );
    assert.equal(breadcrumb.itemListElement.at(-1).item, url);
    const sitemapEntry = sitemap
      .querySelectorAll("url")
      .find((entry) => entry.querySelector("loc")?.text === url);
    assert.equal(
      sitemapEntry?.querySelector("lastmod")?.text.slice(0, 10),
      posting.dateModified.slice(0, 10),
    );
    const tocLinks = page.querySelectorAll(".toc-link");
    for (const link of tocLinks)
      assert.ok(
        page.querySelector(`[id="${link.getAttribute("data-slug")}"]`),
        `${post.id}: broken TOC`,
      );
    if (tocLinks.length)
      assert.ok(page.querySelector("details.toc-mobile > summary"));
    for (const pre of page.querySelectorAll(".prose pre"))
      assert.equal(
        pre.getAttribute("tabindex"),
        "0",
        `${post.id}: code keyboard scrolling`,
      );
  }
  assert.equal(rssURLs.length, published.length);
  assert.equal(new Set(rssURLs).size, published.length);
});

test("archive static pagination lists each public article exactly once in stable date/slug order", () => {
  const totalPages = Math.max(1, Math.ceil(published.length / 12));
  const listed = [];
  for (let page = 1; page <= totalPages; page++) {
    const path = page === 1 ? "/posts/" : `/posts/page/${page}/`;
    const html = pages.get(outputFile(path));
    assert.ok(html, path);
    assert.equal(
      html.querySelector('link[rel="canonical"]')?.getAttribute("href"),
      origin + path,
    );
    assert.ok(sitemapURLs.includes(origin + path));
    assert.equal(html.querySelector('meta[name="robots"]'), null);
    const rows = html.querySelectorAll("[data-post-id]");
    assert.ok(rows.length <= 12 && rows.length > 0);
    for (const row of rows) {
      listed.push(row.getAttribute("data-post-id"));
      assert.equal(
        row.querySelectorAll("a").length,
        1,
        "Unique primary article link",
      );
    }
    assert.equal(
      html
        .querySelector('.pagination [aria-current="page"]')
        ?.getAttribute("href"),
      path,
    );
    if (page > 1) assert.ok(html.querySelector('.pagination a[rel="prev"]'));
    if (page < totalPages)
      assert.ok(html.querySelector('.pagination a[rel="next"]'));
  }
  assert.deepEqual(
    listed,
    published.map((post) => post.id),
  );
  assert.ok(!pages.has("posts/page/1/index.html"));
  assert.ok(!sitemapURLs.includes(origin + "/posts/page/1/"));
  assert.deepEqual(
    pages
      .get("index.html")
      ?.querySelectorAll("[data-post-id]")
      .map((row) => row.getAttribute("data-post-id")),
    published.slice(0, 6).map((post) => post.id),
  );
});

test("all pages have one h1, canonical, social metadata, safe JSON-LD and feed discovery", () => {
  const canonicals = new Set();
  for (const [file, page] of pages) {
    for (const selector of [
      "h1",
      "title",
      'link[rel="canonical"]',
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:image"]',
      'meta[name="twitter:card"]',
      'link[type="application/rss+xml"]',
    ])
      assert.equal(
        page.querySelectorAll(selector).length,
        1,
        `${file}: ${selector}`,
      );
    const canonical = page
      .querySelector('link[rel="canonical"]')
      ?.getAttribute("href");
    assert.ok(canonical?.startsWith(origin));
    assert.ok(!canonicals.has(canonical), `Duplicate canonical: ${canonical}`);
    canonicals.add(canonical);
    const types = schemas(page).map((schema) => schema["@type"]);
    assert.ok(types.includes("WebSite") && types.includes("Person"), file);
    assert.equal(
      page.querySelector("main")?.getAttribute("id"),
      "main-content",
    );
    assert.ok(page.querySelector('.skip-link[href="#main-content"]'));
    for (const anchor of page.querySelectorAll('a[target="_blank"]')) {
      assert.match(anchor.getAttribute("rel") ?? "", /noopener/);
      assert.match(anchor.getAttribute("rel") ?? "", /noreferrer/);
      assert.match(anchor.text, /另開新分頁/);
    }
    for (const script of page.querySelectorAll("script:not([src])"))
      assert.equal(
        script.getAttribute("type"),
        "application/ld+json",
        `${file}: inline executable script violates CSP`,
      );
  }
});

test("category counts, noindex threshold and sitemap exclusions match public content", () => {
  for (const category of categories) {
    const page = pages.get(`categories/${category.slug}/index.html`);
    assert.ok(page);
    const count = published.filter(
      (post) => post.category === category.slug,
    ).length;
    assert.equal(page.querySelectorAll("[data-post-id]").length, count);
    assert.equal(
      Boolean(
        page.querySelector('meta[name="robots"][content="noindex, follow"]'),
      ),
      count < 2,
    );
    assert.equal(
      sitemapURLs.includes(`${origin}/categories/${category.slug}/`),
      count >= 2,
    );
  }
  assert.ok(
    pages
      .get("404.html")
      ?.querySelector('meta[name="robots"][content="noindex, follow"]'),
  );
  assert.ok(!sitemapURLs.some((url) => /\/404(?:\.html)?\/?$/.test(url)));
});

test("all generated internal links, assets and fragment destinations exist", async () => {
  const errors = [];
  for (const [file, page] of pages) {
    const canonical =
      page.querySelector('link[rel="canonical"]')?.getAttribute("href") ??
      origin + "/";
    for (const element of page.querySelectorAll(
      "a[href], img[src], script[src], link[href]",
    )) {
      const href = element.getAttribute("href") ?? element.getAttribute("src");
      if (!href || /^(mailto:|tel:|data:)/.test(href)) continue;
      const url = new URL(href, canonical);
      if (url.origin !== origin) continue;
      // Pages serves its special 404.html at unknown URLs, retaining the original canonical.
      if (file === "404.html" && element.getAttribute("rel") === "canonical")
        continue;
      const target = href.startsWith("#")
        ? file
        : outputFile(decodeURIComponent(url.pathname));
      try {
        await access(join(dist, target));
      } catch {
        errors.push(`${file} → ${href}`);
        continue;
      }
      if (url.hash && pages.has(target)) {
        const id = decodeURIComponent(url.hash.slice(1));
        if (
          !pages
            .get(target)
            ?.querySelectorAll("[id]")
            .some((node) => node.id === id)
        )
          errors.push(`${file} → ${href} (fragment)`);
      }
    }
  }
  assert.deepEqual(errors, []);
});
