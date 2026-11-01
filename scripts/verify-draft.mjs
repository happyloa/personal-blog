import assert from "node:assert/strict";
import { writeFile, unlink, readFile, access } from "node:fs/promises";
import { spawnSync } from "node:child_process";

const npmCLI = process.env.npm_execpath;
if (!npmCLI) throw new Error("Run this script with npm run test:draft.");
const slug = "qa-draft-regression-fixture";
const fixture = `src/content/posts/${slug}.md`;
// wx prevents overwriting an author's file; only this successfully-created fixture is removed.
await writeFile(
  fixture,
  `---\ntitle: QA draft exclusion fixture\ndate: 2020-01-01\ncategory: learning\ndraft: true\n---\n\nThis temporary draft must never be public.\n`,
  { flag: "wx" },
);
try {
  const build = spawnSync(process.execPath, [npmCLI, "run", "build"], {
    stdio: "inherit",
    windowsHide: true,
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: "1" },
  });
  assert.ifError(build.error);
  assert.equal(build.status, 0);
  await assert.rejects(access(`dist/posts/${slug}/index.html`));
  for (const file of [
    "dist/index.html",
    "dist/posts/index.html",
    "dist/rss.xml",
    "dist/sitemap-0.xml",
  ])
    assert.ok(
      !(await readFile(file, "utf8")).includes(slug),
      `Draft leaked into ${file}`,
    );
  const tests = spawnSync(
    process.execPath,
    ["--test", "tests/build-output.test.mjs"],
    { stdio: "inherit", windowsHide: true },
  );
  assert.ifError(tests.error);
  assert.equal(tests.status, 0);
  console.log(
    "Draft fixture excluded from article routes, pagination, categories, RSS and sitemap.",
  );
} finally {
  await unlink(fixture);
}
