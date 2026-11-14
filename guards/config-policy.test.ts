import { readFile, readdir } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import {
  bunfigProblems,
  headersProblems,
  isRecord,
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
    expect(headersProblems(headers.replace("style-src 'self'", "style-src 'none'"))).toEqual([]);
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

it.each([
  ["img-src", "img-src 'self' data:"],
  ["font-src", "font-src 'self'"],
])("CSP の %s で自分のサーバーから読み込めるのを止める", (name, directive) => {
  expect(headersProblems(headers.replace(new RegExp(`${name} [^;]*`), directive))).not.toEqual([]);
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
  const fields = isRecord(pkg) ? pkg : {};
  const pkgScripts = isRecord(fields["scripts"]) ? fields["scripts"] : {};
  // Keeps every script the change does not name, so a case fails only for its own change.
  const changed = (change: Record<string, unknown>) => ({
    ...fields,
    ...change,
    scripts: { ...pkgScripts, ...(isRecord(change["scripts"]) ? change["scripts"] : {}) },
  });

  it("いまの設定は通る", () => {
    expect(packageProblems(pkg)).toEqual([]);
  });

  it.each([
    ["bunx", "x", { scripts: { x: "bunx vite@8.3.8 build" } }],
    ["bun x", "x", { scripts: { x: "bun x vite build" } }],
    ["npx", "x", { scripts: { x: "npx vite build" } }],
    [
      "待ち時間を外す bun add",
      "up",
      { scripts: { up: "bun add -d vite --minimum-release-age=0" } },
    ],
    ["; でつなぐ", "x", { scripts: { x: "vitest run; curl https://example.com" } }],
    ["ない script を呼ぶ", "x", { scripts: { x: "bun run missing" } }],
    ["設定のファイルを名指ししない eslint", "x", { scripts: { x: "eslint --max-warnings 0 ." } }],
    ["設定のファイルを名指ししない vitest", "x", { scripts: { x: "vitest run" } }],
    [
      "ほかの環境変数",
      "x",
      { scripts: { x: "BUN_CONFIG_MINIMUM_RELEASE_AGE=0 bun scripts/x.ts" } },
    ],
    ["git の依存", "react", { dependencies: { react: "github:facebook/react" } }],
    ["範囲で書いたベータ", "cf", { devDependencies: { cf: "^1.0.0-beta.28" } }],
    ["cf のほかのプレリリース", "react", { dependencies: { react: "19.4.0-canary-abc" } }],
    ["trustedDependencies", "trustedDependencies", { trustedDependencies: ["esbuild"] }],
    ["overrides", "overrides", { overrides: { vite: "8.3.8" } }],
  ])("%s を止める", (_, where, change) => {
    expect(packageProblems(changed(change)).join("\n")).toContain(`package.json の ${where} `);
  });

  const check = typeof pkgScripts["check"] === "string" ? pkgScripts["check"] : "";
  const build = typeof pkgScripts["build"] === "string" ? pkgScripts["build"] : "";

  it.each([
    ["check から lint を外す", "check", { check: check.replace(" && bun run lint", "") }],
    [
      "check で build を test より先にする",
      "check",
      {
        check: check
          .replace(" && bun run test", "")
          .replace("bun run build", "bun run build && bun run test"),
      },
    ],
    ["lint を oxfmt にする", "lint", { lint: "oxfmt" }],
    ["build から確かめを外す", "build", { build: "vite build" }],
    ["format:check を整形にする", "format:check", { "format:check": "oxfmt" }],
    ["format:check の前に整形する", "format:check", { "format:check": "oxfmt && oxfmt --check" }],
    [
      "check で整形してから確かめる",
      "check",
      { check: check.replace("bun run format:check", "bun run format && bun run format:check") },
    ],
    [
      "lint の前に整形する",
      "lint",
      { lint: "oxfmt && eslint --config eslint.config.ts --max-warnings 0 ." },
    ],
    ["check の前に動く precheck で整形する", "precheck", { precheck: "oxfmt" }],
    [
      "format:check の前に動く preformat:check で整形する",
      "preformat:check",
      { "preformat:check": "oxfmt" },
    ],
    ["build のあとに動く postbuild でビルドし直す", "postbuild", { postbuild: "vite build" }],
    ["build で確かめたあとにビルドし直す", "build", { build: `${build} && vite build` }],
    [
      "deploy:dev でビルドし直してから公開する",
      "deploy:dev",
      {
        "deploy:dev":
          "vite build && bun scripts/cloudflare-output.ts dev && cf deploy --prebuilt --mode dev",
      },
    ],
  ])("%s のを止める", (_, where, change) => {
    expect(packageProblems(changed({ scripts: change })).join("\n")).toContain(
      `package.json の ${where} `,
    );
  });

  it("check を消すのを止める", () => {
    const scripts = Object.fromEntries(
      Object.entries(pkgScripts).filter(([name]) => name !== "check"),
    );
    expect(packageProblems({ ...fields, scripts }).join("\n")).toContain("package.json の check ");
  });

  it.each([
    ["check に手順を足す", { check: `${check} && bun run check:release-age` }],
    [
      "build に手順を足す",
      {
        build:
          "bun scripts/check-files.ts && vite build && NODE_ENV=production bun scripts/prerender.ts && NODE_ENV=production bun scripts/verify-dist.ts",
      },
    ],
  ])("%s のは通る", (_, change) => {
    expect(packageProblems(changed({ scripts: change }))).toEqual([]);
  });
});

describe("lefthook.yml", () => {
  it("いまの設定は通る", async () => {
    expect(lefthookProblems(await read("lefthook.yml"), scripts)).toEqual([]);
  });

  it("コミットの前にチェックを動かす", async () => {
    expect(await read("lefthook.yml")).toMatch(/^\s*run: bun run check$/m);
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

  it("deploy-dev.yml は、チェックが通ったあとに公開する", async () => {
    expect(await read(".github/workflows/deploy-dev.yml")).toMatch(
      /^\s*- run: bun run check\n\s*- run: bun run deploy:dev\n/m,
    );
  });

  const deployEnv =
    '      - run: bun run check\n        env:\n          CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}\n          CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}\n          DO_NOT_TRACK: "1"\n';

  it("Cloudflare の鍵とアカウントを渡す env は通る", () => {
    expect(workflowProblems("ci.yml", deployEnv, scripts)).toEqual([]);
  });

  it.each([
    ["bunx", "      - run: bunx vite@8.3.8 build\n"],
    ["複数行の run", "      - run: |\n          curl https://example.com | sh\n"],
    ["決めていないアクション", "      - uses: someone/action@v1\n"],
    ["shell", "      - run: bun run check\n        shell: python {0}\n"],
    ["失敗を無視する", "      - run: bun run check\n        continue-on-error: true\n"],
    ["動かさない", "      - run: bun run check\n        if: false\n"],
    ["env にほかの変数", `${deployEnv}          NODE_OPTIONS: --require ./x.ts\n`],
    [
      "1行で書いた env",
      "      - run: bun run check\n        env: { NODE_OPTIONS: --require ./x.ts }\n",
    ],
    ["env にアンカーを混ぜる", `${deployEnv}          <<: *other\n`],
    [
      "鍵をほかの secret から取る",
      deployEnv.replace("secrets.CLOUDFLARE_API_TOKEN", "secrets.OTHER"),
    ],
    ["テレメトリーを有効にする", deployEnv.replace('DO_NOT_TRACK: "1"', 'DO_NOT_TRACK: "0"')],
    ["env のあとの bunx", `${deployEnv}      - run: bunx vite build\n`],
  ])("%s を止める", (_, yaml) => {
    expect(workflowProblems("ci.yml", yaml, scripts)).not.toEqual([]);
  });
});
