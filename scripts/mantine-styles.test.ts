import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, test } from "vitest";
import { expectedMantineStyles, mantineStylesCss, stylesFile } from "./mantine-styles";

const root = fileURLToPath(new URL("../", import.meta.url));

test(`${stylesFile} は、ページが書く style をすべて持つ。違うときは bun scripts/mantine-styles.ts で書き直す`, async () => {
  expect(await readFile(`${root}${stylesFile}`, "utf8")).toBe(await expectedMantineStyles(root));
});

describe("style をクラスのルールにできないページは止める", () => {
  test("style の props で書いた値", () => {
    expect(() =>
      mantineStylesCss(['<p class="mantine-Text-root" style="--text-fz:1rem;margin-top:4px">']),
    ).toThrow("margin-top:4px");
  });

  test("同じ選び方で、違う style の要素", () => {
    expect(() =>
      mantineStylesCss([
        '<div class="mantine-Stack-root" style="--stack-gap:1rem"></div>',
        '<div class="mantine-Stack-root" style="--stack-gap:2rem"></div>',
      ]),
    ).toThrow("要素ごとに違います");
  });

  test("ほかの要素のルールが当たって、ない値を足す", () => {
    expect(() =>
      mantineStylesCss([
        '<div class="mantine-Group-root" style="--group-gap:1rem;--group-wrap:wrap"></div>',
        '<div class="row mantine-Group-root" style="--group-gap:2rem"></div>',
      ]),
    ).toThrow("--group-wrap");
  });

  test("押せるかどうかのように、開いている間に変わる属性やクラスでは選ばない", () => {
    expect(
      mantineStylesCss([
        '<button class="mantine-active mantine-Button-root" data-disabled="true" data-size="md" style="--button-color:white">',
      ]),
    ).toContain('.mantine-Button-root[data-size="md"] {');
  });
});
