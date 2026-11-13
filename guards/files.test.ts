import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { zones } from "./zones";

const root = new URL("../", import.meta.url);
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0")
  .filter((file) => file !== "");

// JavaScript and .d.ts files are out of reach of the type check and of ESLint's zone rules, and a
// .d.ts can declare a value that does not exist. .npmrc and similar files change where packages
// come from. Everything not matched here fails.
const allowedFile = [
  /^(?!.*\.d\.ts$)[\w./-]+\.tsx?$/,
  /^[\w./-]+\.(json|md|css|html|yml|toml)$/,
  /^bun\.lock$/,
  /^\.gitignore$/,
  /^public\/_headers$/,
  /^\.github\/guarded-paths$/,
  /^\.github\/guards-unchanged\.sh$/,
];

// Every file under guard-probes/ belongs to a test that reads it.
const claimedProbe = [
  /^guard-probes\/(app|platform)\/tsconfig\.json$/,
  /^guard-probes\/(app|platform)\/(blocked|allowed)\/[\w-]+\.tsx?$/,
  /^guard-probes\/build\/(blocked|allowed|helpers)\/[\w-]+\.(ts|html)$/,
];

it("決めた種類のファイルだけがある", () => {
  expect(tracked.filter((file) => !allowedFile.some((pattern) => pattern.test(file)))).toEqual([]);
});

it("guard-probes/ のファイルは、すべてテストが読む", () => {
  expect(
    tracked.filter(
      (file) =>
        file.startsWith("guard-probes/") && !claimedProbe.some((pattern) => pattern.test(file)),
    ),
  ).toEqual([]);
});

it("src/ のファイルは、どれか1つのゾーンにある", () => {
  const dirs = Object.values(zones).map((zone) => zone.dir);
  expect(
    tracked.filter((file) => file.startsWith("src/") && !dirs.some((dir) => file.startsWith(dir))),
  ).toEqual([]);
});

describe.each(Object.entries(zones))("%s ゾーンの tsconfig", (_, zone) => {
  it("ゾーンのフォルダだけを含む", async () => {
    const config: unknown = JSON.parse(await readFile(new URL(zone.tsconfig, root), "utf8"));
    expect(config).toMatchObject({ include: [zone.dir.replace(/\/$/, "")] });
  });
});

it("機能のコードは、ブラウザの型なしでコンパイルする", async () => {
  const config: unknown = JSON.parse(await readFile(new URL(zones.app.tsconfig, root), "utf8"));
  expect(config).toMatchObject({ compilerOptions: { lib: ["ES2023"], types: [] } });
});
