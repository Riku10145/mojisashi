import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";

const publicDir = fileURLToPath(new URL("../public/", import.meta.url));

/** The headers public/_headers gives each path, as path → lines such as "Content-Type: …". */
function headerBlocks(file: string): Map<string, string[]> {
  const blocks = new Map<string, string[]>();
  let current: string[] | undefined;
  for (const line of file.split("\n")) {
    if (/^\S/.test(line)) {
      current = [];
      blocks.set(line.trim(), current);
    } else if (line.trim() !== "") {
      current?.push(line.trim());
    }
  }
  return blocks;
}

// Cloudflare serves .txt as text/plain with no charset, and browsers then read it as windows-1252.
test("public/ の .txt は、どれも _headers で charset=utf-8 を付けて返す", async () => {
  const blocks = headerBlocks(await readFile(`${publicDir}_headers`, "utf8"));
  const texts = (await readdir(publicDir)).filter((name) => name.endsWith(".txt"));
  expect(texts.length).toBeGreaterThan(0);
  for (const name of texts) {
    expect(blocks.get(`/${name}`) ?? [], name).toContain("Content-Type: text/plain; charset=utf-8");
  }
});
