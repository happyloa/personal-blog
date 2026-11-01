import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve, join } from "node:path";
import { pathToFileURL } from "node:url";

// Point at a dev-only Lighthouse installation; no runtime dependency is added.
const moduleRoot = process.env.LIGHTHOUSE_MODULE_ROOT;
if (!moduleRoot)
  throw new Error(
    "Set LIGHTHOUSE_MODULE_ROOT to the node_modules directory containing lighthouse and chrome-launcher.",
  );
const { default: lighthouse } = await import(
  pathToFileURL(join(moduleRoot, "lighthouse/core/index.js")).href
);
const { launch } = await import(
  pathToFileURL(join(moduleRoot, "chrome-launcher/dist/index.js")).href
);
const label = process.argv[2] ?? "after";
const origin = process.argv[3] ?? "http://127.0.0.1:4321";
const out = resolve(process.argv[4] ?? `.lighthouse/${label}`);
await mkdir(out, { recursive: true });
const pages = [
  ["home", "/"],
  ["article", "/posts/database-systems-comparison/"],
  ["mermaid", "/posts/how-browser-renders-webpage/"],
  // There is no archive route in the baseline; its full list is on the homepage.
  ["archive", label === "before" ? "/" : "/posts/"],
  ["categories", "/categories/"],
];
/** @type {{label: string, origin: string, date: string, results: Record<string, unknown>[]}} */
const summary = { label, origin, date: new Date().toISOString(), results: [] };
for (const [page, path] of pages) {
  for (let run = 1; run <= 3; run++) {
    const file = join(out, `${page}-${run}.report.json`);
    let lhr;
    try {
      lhr = JSON.parse(await readFile(file, "utf8"));
    } catch {
      const chrome = await launch({
        chromePath: process.env.CHROME_PATH,
        chromeFlags: ["--headless=new", "--disable-gpu", "--no-first-run"],
      });
      try {
        const result = await lighthouse(origin + path, {
          port: chrome.port,
          output: ["html", "json"],
          logLevel: "error",
          onlyCategories: [
            "performance",
            "accessibility",
            "best-practices",
            "seo",
          ],
        });
        lhr = result.lhr;
        await writeFile(file, result.report[1]);
        await writeFile(
          join(out, `${page}-${run}.report.html`),
          result.report[0],
        );
        await writeFile(
          join(out, `${page}-${run}.trace.json`),
          JSON.stringify(
            result.artifacts.Trace ?? result.artifacts.traces ?? {},
          ),
        );
        await writeFile(
          join(out, `${page}-${run}.devtools.json`),
          JSON.stringify(
            result.artifacts.DevtoolsLog ?? result.artifacts.devtoolsLogs ?? {},
          ),
        );
      } finally {
        await chrome.kill();
      }
    }
    if (lhr.runtimeError) throw new Error(JSON.stringify(lhr.runtimeError));
    const row = {
      page,
      path,
      run,
      lighthouse: lhr.lighthouseVersion,
      userAgent: lhr.userAgent,
      config: lhr.configSettings,
      scores: Object.fromEntries(
        Object.entries(lhr.categories).map(([key, value]) => [
          key,
          Math.round(value.score * 100),
        ]),
      ),
      lcp: lhr.audits["largest-contentful-paint"].numericValue,
      cls: lhr.audits["cumulative-layout-shift"].numericValue,
      tbt: lhr.audits["total-blocking-time"].numericValue,
      resources: lhr.audits["resource-summary"].details.items,
      failures: Object.values(lhr.audits)
        .filter((audit) => audit.score !== null && audit.score < 1)
        .map(({ id, title, score, details }) => ({
          id,
          title,
          score,
          details,
        })),
    };
    summary.results.push(row);
    await writeFile(
      join(out, "summary.json"),
      JSON.stringify(summary, null, 2),
    );
    console.log(
      `${label} ${page} ${run}: ${JSON.stringify(row.scores)} LCP=${Math.round(row.lcp)} CLS=${row.cls} TBT=${row.tbt}`,
    );
  }
}
