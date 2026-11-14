// Which files the repository may hold (ADR 0007). scripts/check-files.ts runs this before every
// other step of bun run check, outside the tools it protects: a vitest.config.* could otherwise
// leave out the test that reads it.
import { zones } from "./zones";

const readAdr0007 = "docs/adr/0007-confine-browser-access.md を読んでください。";

// ESLint, Vitest, Vite, PostCSS, lefthook, Bun, oxfmt and cf each find their config by name in the
// root, and several prefer another name to the one that is guarded. So the root holds these files
// only.
const rootFiles = new Set([
  ".gitignore",
  ".oxfmtrc.json",
  "CLAUDE.md",
  "GLOSSARY.md",
  "README.md",
  "bun.lock",
  "bunfig.toml",
  "cloudflare.config.ts",
  "eslint.config.ts",
  "index.html",
  "lefthook.yml",
  "package.json",
  "tsconfig.json",
  "tsconfig.base.json",
  "tsconfig.app.json",
  "tsconfig.platform.json",
  "tsconfig.shell.json",
  "tsconfig.node.json",
  "vite.config.ts",
]);

// Below the root, by kind. JavaScript and .d.ts files are out of reach of the type check and of
// ESLint's zone rules, and a .d.ts can declare a value that does not exist. A folder whose name
// starts with a dot, such as .config/, is where some tools look for config, so only .github/ is
// allowed, file by file. So are Claude Code skills as Markdown. A skill can still run commands and
// grant tools to an agent, so .claude/ is in .github/guarded-paths.
const nestedFile = [
  /^(?!\.)(?!.*\.d\.ts$)[\w-]+\/[\w./-]+\.tsx?$/,
  /^(?!\.)[\w-]+\/[\w./-]+\.(json|md|css|html|yml|toml)$/,
  /^public\/_headers$/,
  /^\.github\/(guarded-paths|guards-unchanged\.sh|workflows\/[\w-]+\.yml)$/,
  /^\.claude\/skills\/[\w-]+\/[\w/-]+\.md$/,
];

// Every file under guard-probes/ belongs to a test that reads it.
const claimedProbe = [
  /^guard-probes\/(app|platform)\/tsconfig\.json$/,
  /^guard-probes\/(app|platform)\/(blocked|allowed)\/[\w-]+\.tsx?$/,
  /^guard-probes\/build\/(blocked|allowed|helpers)\/[\w-]+\.(ts|html)$/,
];

/** Problems with the tracked files: a kind or name not allowed, an unclaimed probe, src/ outside a zone. */
export function fileProblems(tracked: readonly string[]): string[] {
  const dirs = Object.values(zones).map((zone) => zone.dir);
  return tracked.flatMap((file) => {
    if (!(rootFiles.has(file) || nestedFile.some((pattern) => pattern.test(file)))) {
      return [`${file} は、決めた種類のファイルではありません。${readAdr0007}`];
    }
    if (file.startsWith("guard-probes/") && !claimedProbe.some((pattern) => pattern.test(file))) {
      return [`${file} は、どのテストも読みません。${readAdr0007}`];
    }
    if (file.startsWith("src/") && !dirs.some((dir) => file.startsWith(dir))) {
      return [`${file} は、どのゾーンにもありません。${readAdr0007}`];
    }
    return [];
  });
}
