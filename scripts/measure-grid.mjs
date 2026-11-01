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
const label = process.argv[2] ?? "before";
const url = process.argv[3] ?? "http://127.0.0.1:4322/";
const out = resolve(`.lighthouse/grid-${label}`);
await mkdir(out, { recursive: true });
const browser = await puppeteer.launch({
  executablePath: process.env.CHROME_PATH,
  headless: true,
});
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900 });
  await page.evaluateOnNewDocument(() => {
    const stats = { count: 0, duration: 0 };
    Reflect.set(window, "__rafStats", stats);
    const native = window.requestAnimationFrame.bind(window);
    window.requestAnimationFrame = (callback) =>
      native((time) => {
        const start = performance.now();
        stats.count++;
        callback(time);
        stats.duration += performance.now() - start;
      });
  });
  await page.goto(url, { waitUntil: "networkidle0" });
  const cdp = await page.createCDPSession();
  await cdp.send("Performance.enable");
  await page.tracing.start({
    path: join(out, "trace.json"),
    categories: ["devtools.timeline", "v8", "blink.user_timing"],
  });
  const snapshot = async () => ({
    raf: await page.evaluate(() => ({ ...Reflect.get(window, "__rafStats") })),
    metrics: Object.fromEntries(
      (await cdp.send("Performance.getMetrics")).metrics.map(
        (/** @type {{name: string, value: number}} */ metric) => [
          metric.name,
          metric.value,
        ],
      ),
    ),
  });
  const start = await snapshot();
  await new Promise((done) => setTimeout(done, 10000));
  const idle = await snapshot();
  for (let i = 0; i < 180; i++) {
    await page.mouse.move(80 + i * 6, 100 + (i % 30) * 16);
    await new Promise((done) => setTimeout(done, 16));
  }
  const pointer = await snapshot();
  for (let i = 0; i < 30; i++) {
    await page.mouse.wheel({ deltaY: 80 });
    await new Promise((done) => setTimeout(done, 100));
  }
  await new Promise((done) => setTimeout(done, 1500));
  const scroll = await snapshot();
  await page.tracing.stop();
  const result = { label, url, start, idle, pointer, scroll };
  await writeFile(join(out, "summary.json"), JSON.stringify(result, null, 2));
  console.log(JSON.stringify(result, null, 2));
} finally {
  await browser.close();
}
