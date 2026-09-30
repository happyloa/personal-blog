import { defineCollection } from "astro:content";
import { z } from "astro/zod";
import { glob } from "astro/loaders";
import { categories } from "./utils/categories.js";

const posts = defineCollection({
  loader: glob({ pattern: "*.md", base: "./src/content/posts" }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      description: z.string().optional(),
      date: z.coerce.date(),
      // 內容有實質修訂時填寫，會反映在 dateModified、article:modified_time 與 sitemap 的 lastmod。
      updated: z.coerce.date().optional(),
      category: z.enum(categories.map((category) => category.slug)),
      cover: image().optional(),
      draft: z.boolean().default(false),
    }),
});

export const collections = { posts };
