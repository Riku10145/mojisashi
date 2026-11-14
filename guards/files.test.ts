import { execFileSync } from "node:child_process";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { fileProblems } from "./files";
import { zones } from "./zones";

const root = new URL("../", import.meta.url);
const tracked = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0")
  .filter((file) => file !== "");

describe("fileProblems", () => {
  it("いまのファイルは通る", () => {
    expect(fileProblems(tracked)).toEqual([]);
  });

  it("スキルの Markdown は通る", () => {
    expect(fileProblems([".claude/skills/verify-mojisashi/features/count.md"])).toEqual([]);
  });

  it.each([
    ["JavaScript", "src/app/leak.js"],
    [".d.ts", "src/app/globals.d.ts"],
    ["ESLint の設定", "eslint.config.js"],
    ["Vitest の設定", "vitest.config.ts"],
    ["Vitest のワークスペース", "vitest.workspace.json"],
    ["PostCSS の設定", "postcss.config.ts"],
    ["PostCSS の設定", ".postcssrc.json"],
    ["Tailwind の設定", "tailwind.config.ts"],
    ["lefthook の設定", ".lefthook.yml"],
    ["lefthook の設定", "lefthook-local.yml"],
    ["lefthook の設定", ".config/lefthook.yml"],
    ["npm の設定", ".npmrc"],
    ["環境変数", ".env.local"],
    ["Claude Code の設定", ".claude/settings.json"],
    ["Claude Code のフック", ".claude/hooks/check.ts"],
    ["スキルの中のスクリプト", ".claude/skills/verify-mojisashi/drive.mjs"],
    ["スキルの中の TypeScript", ".claude/skills/verify-mojisashi/drive.ts"],
    ["テストが読まない probe", "guard-probes/app/note.md"],
    ["ゾーンの外のコード", "src/leak.ts"],
  ])("%s を止める（%s）", (_, file) => {
    expect(fileProblems([...tracked, file])).not.toEqual([]);
  });
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
