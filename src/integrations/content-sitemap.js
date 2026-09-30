import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import sitemap from "@astrojs/sitemap";
import { parse } from "node-html-parser";

/** @param {string} html 已建置的頁面 */
function getSitemapMetadata(html) {
  const head = parse(html).querySelector("head");
  const canonical = head
    ?.querySelector('link[rel="canonical"]')
    ?.getAttribute("href");
  if (!canonical) throw new Error("Sitemap 頁面缺少 canonical 網址。");

  const robots = head
    ?.querySelector('meta[name="robots"]')
    ?.getAttribute("content");
  const lastmod = (
    head?.querySelector('meta[property="article:modified_time"]') ??
    head?.querySelector('meta[property="article:published_time"]')
  )?.getAttribute("content");

  return {
    url: new URL(canonical).href,
    noindex: /\bnoindex\b/i.test(robots ?? ""),
    lastmod,
  };
}

/**
 * 使用正式頁面的 metadata，避免另行解析文章或重複計算分類數量。
 * @returns {import("astro").AstroIntegration}
 */
export default function contentSitemap() {
  /** @type {Map<string, ReturnType<typeof getSitemapMetadata>>} */
  const metadata = new Map();
  const integration = sitemap({
    serialize(item) {
      const page = metadata.get(item.url);
      if (page?.noindex) return undefined;
      return page?.lastmod ? { ...item, lastmod: page.lastmod } : item;
    },
  });
  const buildDone = integration.hooks["astro:build:done"];

  return {
    ...integration,
    hooks: {
      ...integration.hooks,
      "astro:build:done": async (options) => {
        metadata.clear();
        const files = await readdir(options.dir, {
          recursive: true,
          withFileTypes: true,
        });
        for (const file of files) {
          if (!file.isFile() || !file.name.endsWith(".html")) continue;
          const html = await readFile(join(file.parentPath, file.name), "utf8");
          const page = getSitemapMetadata(html);
          metadata.set(page.url, page);
        }
        await buildDone?.(options);
      },
    },
  };
}
