import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import test from "node:test";

const require = createRequire(import.meta.url);
const mermaidRequire = createRequire(require.resolve("mermaid"));
const typographyRequire = createRequire(
  require.resolve("@tailwindcss/typography"),
);
const katex = mermaidRequire("katex");

test("Mermaid 使用的 KaTeX 能渲染分數與根號", () => {
  const html = katex.renderToString(String.raw`\frac{a}{b} + \sqrt{x}`);
  assert.match(html, /class="katex"/);
  assert.match(html, /<mfrac>/);
  assert.match(html, /<msqrt>/);
});

test("KaTeX 不接受從原型繼承的 trust 設定", () => {
  const expression = String.raw`\href{javascript:alert(1)}{click}`;
  const inheritedOptions = Object.create({ trust: true });
  assert.doesNotMatch(
    katex.renderToString(expression, inheritedOptions),
    /\bhref=["']javascript:/i,
  );

  const original = Object.getOwnPropertyDescriptor(Object.prototype, "trust");
  try {
    Object.defineProperty(Object.prototype, "trust", {
      value: true,
      configurable: true,
      writable: true,
    });
    assert.doesNotMatch(
      katex.renderToString(expression, {}),
      /\bhref=["']javascript:/i,
    );
  } finally {
    if (original) Object.defineProperty(Object.prototype, "trust", original);
    else Reflect.deleteProperty(Object.prototype, "trust");
  }

  assert.match(
    katex.renderToString(expression, { trust: true }),
    /\bhref=["']javascript:/i,
  );
});

test("Typography 的 selector parser 能在期限內解析 400 KB 平面選擇器", () => {
  const parserPath = typographyRequire.resolve("postcss-selector-parser");
  const result = spawnSync(process.execPath, ["--input-type=commonjs"], {
    input: `
      const assert = require("node:assert/strict");
      const parser = require(${JSON.stringify(parserPath)});
      const selector = ".a".repeat(200_000);
      assert.equal(parser().processSync(selector), selector);
    `,
    encoding: "utf8",
    timeout: 10_000,
    windowsHide: true,
  });
  assert.ifError(result.error);
  assert.equal(result.status, 0, result.stderr);
});
