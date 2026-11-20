import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { expect, test } from "vitest";
import { shippedPackages } from "./dist-policy";
import { licensesFile, licensesText } from "./licenses";

const root = fileURLToPath(new URL("../", import.meta.url));

test(`${licensesFile} は、ページに入るパッケージのライセンスをすべて持つ。違うときは bun scripts/licenses.ts で書き直す`, async () => {
  expect(await readFile(`${root}${licensesFile}`, "utf8")).toBe(await licensesText(root));
});

test("ライセンスの一覧は、ページに入るパッケージごとに、著作権の表示と MIT の許諾の文を持つ", async () => {
  const text = await licensesText(root);
  for (const name of shippedPackages) {
    const section = text.split(`==> ${name} <==`)[1]?.split("==> ")[0] ?? "";
    expect(section, name).toMatch(/Copyright \(c\)/);
    expect(section, name).toContain("Permission is hereby granted, free of charge");
  }
});
