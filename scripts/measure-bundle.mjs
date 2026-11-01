import { readFile, writeFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { gzipSync } from "node:zlib";

const beforeDist = resolve(process.argv[2] ?? ".lighthouse/before-dist");
const afterDist = resolve(process.argv[3] ?? "dist");
const beforeReports = resolve(process.argv[4] ?? ".lighthouse/before");
const afterReports = resolve(process.argv[5] ?? ".lighthouse/after");
/** @type {Record<string, unknown>} */
const output = {};
for (const page of ["home", "article", "mermaid", "archive", "categories"]) {
  /** @type {Record<string, any>} */
  const comparison = {};
  for (const [label, root, reports] of [
    ["before", beforeDist, beforeReports],
    ["after", afterDist, afterReports],
  ]) {
    const lhr = JSON.parse(
      await readFile(join(reports, `${page}-1.report.json`), "utf8"),
    );
    const pageOrigin = new URL(lhr.finalUrl).origin;
    /** @type {Record<string, {files: unknown[], bytes: number, gzip: number, transfer: number, requests: number}>} */
    const kinds = {};
    for (const kind of ["Script", "Stylesheet", "Document"]) {
      const requests = lhr.audits["network-requests"].details.items.filter(
        (/** @type {any} */ item) =>
          item.resourceType === kind && new URL(item.url).origin === pageOrigin,
      );
      const measured = await Promise.all(
        requests.map(async (/** @type {any} */ item) => {
          const path = decodeURIComponent(new URL(item.url).pathname);
          const file = path.endsWith("/") ? path + "index.html" : path;
          const bytes = await readFile(join(root, file.slice(1)));
          return {
            path,
            bytes: bytes.length,
            gzip: gzipSync(bytes).length,
            transfer: item.transferSize,
          };
        }),
      );
      kinds[kind] = {
        files: measured,
        bytes: measured.reduce(
          (/** @type {number} */ sum, /** @type {any} */ item) =>
            sum + item.bytes,
          0,
        ),
        gzip: measured.reduce(
          (/** @type {number} */ sum, /** @type {any} */ item) =>
            sum + item.gzip,
          0,
        ),
        transfer: measured.reduce(
          (/** @type {number} */ sum, /** @type {any} */ item) =>
            sum + item.transfer,
          0,
        ),
        requests: measured.length,
      };
    }
    comparison[label] = kinds;
  }
  comparison.delta = Object.fromEntries(
    ["Script", "Stylesheet", "Document"].map((kind) => [
      kind,
      {
        bytes: comparison.after[kind].bytes - comparison.before[kind].bytes,
        gzip: comparison.after[kind].gzip - comparison.before[kind].gzip,
        transfer:
          comparison.after[kind].transfer - comparison.before[kind].transfer,
      },
    ]),
  );
  output[page] = comparison;
  console.log(`${page}: ${JSON.stringify(comparison.delta)}`);
}
await writeFile(
  resolve(".lighthouse/bundle-summary.json"),
  JSON.stringify(output, null, 2),
);
