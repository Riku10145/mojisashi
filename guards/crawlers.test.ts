import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

const robots = await readFile(new URL("../public/robots.txt", import.meta.url), "utf8");
const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const lines = robots.split("\n").map((line) => line.trim());

describe("public/robots.txt は ADR 0016 のとおり", () => {
  it("すべてのクローラに読むことを許し、どこも止めない", () => {
    expect(lines).toContain("User-agent: *");
    expect(lines).toContain("Allow: /");
    expect(lines.filter((line) => line.startsWith("Disallow"))).toEqual([]);
  });

  it("検索と AI の回答は許し、学習は許さない", () => {
    expect(lines.filter((line) => line.startsWith("Content-Signal"))).toEqual([
      "Content-Signal: search=yes, ai-input=yes, ai-train=no",
    ]);
  });

  it("本番の sitemap.xml を指す", () => {
    expect(lines.filter((line) => line.startsWith("Sitemap"))).toEqual([
      "Sitemap: https://mojisashi.app/sitemap.xml",
    ]);
  });
});

it("public/sitemap.xml には、本番の URL だけが入る", () => {
  const urls = [...sitemap.matchAll(/<loc>([^<]*)<\/loc>/g)].map(([, url]) => url);
  expect(urls).toEqual(["https://mojisashi.app/"]);
});
