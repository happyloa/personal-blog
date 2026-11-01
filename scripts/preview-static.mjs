import { createServer } from "node:http";
import { readFile, stat } from "node:fs/promises";
import { resolve, extname, sep } from "node:path";
import { gzipSync } from "node:zlib";

const root = resolve(process.argv[2] ?? "dist");
const port = Number(process.argv[3] ?? 4321);
/** @type {Record<string, string>} */
const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".xml": "application/xml; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".webp": "image/webp",
  ".woff2": "font/woff2",
};
// Serve the actual Pages headers, including CSP, during local acceptance checks.
/** @type {Array<{path: string, headers: Record<string, string>}>} */
const rules = [];
for (const line of (await readFile(resolve(root, "_headers"), "utf8")).split(
  /\r?\n/,
)) {
  if (!line.trim() || line.trimStart().startsWith("#")) continue;
  if (!/^\s/.test(line)) rules.push({ path: line.trim(), headers: {} });
  else {
    const colon = line.indexOf(":");
    const rule = rules.at(-1);
    if (colon > 0 && rule)
      rule.headers[line.slice(0, colon).trim()] = line.slice(colon + 1).trim();
  }
}
createServer(async (req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url ?? "/", "http://localhost").pathname,
    );
    let file = resolve(root, `.${pathname}`);
    if (file !== root && !file.startsWith(root + sep)) {
      res.writeHead(403).end();
      return;
    }
    let status = 200;
    try {
      if ((await stat(file)).isDirectory()) file = resolve(file, "index.html");
      await stat(file);
    } catch {
      status = 404;
      file = resolve(root, "404.html");
    }
    /** @type {Record<string, string>} */
    const headers = {
      "Content-Type": types[extname(file)] ?? "application/octet-stream",
      Vary: "Accept-Encoding",
    };
    for (const rule of rules) {
      const matches = rule.path.endsWith("*")
        ? pathname.startsWith(rule.path.slice(0, -1))
        : pathname === rule.path;
      if (matches) Object.assign(headers, rule.headers);
    }
    let body = await readFile(file);
    if (
      /gzip/.test(req.headers["accept-encoding"] ?? "") &&
      /\.(html|css|js|json|xml|svg)$/.test(file)
    ) {
      body = gzipSync(body);
      headers["Content-Encoding"] = "gzip";
    }
    headers["Content-Length"] = String(body.length);
    res
      .writeHead(status, headers)
      .end(req.method === "HEAD" ? undefined : body);
  } catch {
    res.writeHead(500).end("Preview error");
  }
}).listen(port, "127.0.0.1", () =>
  console.log(`http://127.0.0.1:${port} (${root})`),
);
