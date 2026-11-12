import { readFile } from "node:fs/promises";
import { expect, it } from "vitest";

// ESLint and the type check never read index.html, and Vite bundles an inline module script from it.
const indexHtml = await readFile(new URL("index.html", import.meta.url), "utf8");

it("スクリプトは src/entry-client.tsx を読み込む1つだけ", () => {
  expect(indexHtml.match(/<script\b/gi)).toHaveLength(1);
  expect(indexHtml).toContain('<script type="module" src="/src/entry-client.tsx"></script>');
});

it("<style> がない", () => {
  expect(indexHtml).not.toMatch(/<style\b/i);
});

it("style 属性がない", () => {
  expect(indexHtml).not.toMatch(/\sstyle\s*=/i);
});

it("on で始まる属性がない", () => {
  expect(indexHtml).not.toMatch(/\son[a-z]+\s*=/i);
});
