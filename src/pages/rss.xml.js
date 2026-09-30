import rss from "@astrojs/rss";
import { getPostDescription, getPublishedPostsSorted } from "../utils/posts";
import { toPlainTextExcerpt } from "../utils/summary";
import { site } from "../utils/site";

/** @param {import("astro").APIContext} context */
export async function GET(context) {
  if (!context.site)
    throw new Error("RSS 需要設定 astro.config 的 site 網址。");
  const posts = await getPublishedPostsSorted();
  const feedURL = new URL("/rss.xml", context.site).href;
  // 取全站最新的異動時間。不能只看 posts[0]：排序只依 date，若替舊文補了 updated，
  // 它不會排到最前面，lastBuildDate 就反映不出那次修訂。
  const latest = posts.reduce((max, post) => {
    const stamp = new Date(post.data.updated ?? post.data.date);
    return stamp > max ? stamp : max;
  }, new Date(0));

  return rss({
    title: site.title,
    description: site.description,
    site: context.site,
    xmlns: { atom: "http://www.w3.org/2005/Atom" },
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.date,
      description: toPlainTextExcerpt(getPostDescription(post)),
      link: `/posts/${post.id}/`,
    })),
    // atom:link rel="self" 與 lastBuildDate 是 W3C Feed Validator 的建議項目，
    // 前者讓閱讀器知道 feed 的正規位置，後者避免每次抓取都當成有更新。
    customData: [
      `<language>zh-tw</language>`,
      `<lastBuildDate>${new Date(latest).toUTCString()}</lastBuildDate>`,
      `<atom:link href="${feedURL}" rel="self" type="application/rss+xml" />`,
    ].join(""),
  });
}
