import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { build, type Rolldown } from "vite";

const readAdr0007 = "docs/adr/0007-confine-browser-access.md を読んでください。";

/** One file that a build writes into dist/, with the files it was made from. */
export type BuiltFile = { name: string; content: string | Uint8Array; sources: string[] };

function isOutput(value: unknown): value is Rolldown.RolldownOutput {
  return typeof value === "object" && value !== null && "output" in value;
}

/**
 * Builds the page with a config this file owns instead of vite.config.ts, so a plugin or option
 * added there changes dist/ without changing this build, and verify-dist.ts sees the difference.
 * The options must match vite.config.ts; when they drift, verify-dist.ts fails the build.
 */
export async function referenceBuild(root: string, input?: string): Promise<BuiltFile[]> {
  const result = await build({
    configFile: false,
    envDir: false,
    root,
    cacheDir: `${root}node_modules/.vite-reference`,
    logLevel: "silent",
    plugins: [react(), tailwindcss()],
    // An empty config stops Vite from looking for a postcss.config file next to the page.
    css: { postcss: {} },
    build: {
      write: false,
      // Every asset becomes its own file, so provenanceProblems sees where it came from.
      assetsInlineLimit: 0,
      ...(input === undefined ? {} : { rolldownOptions: { input } }),
    },
  });
  const files: BuiltFile[] = [];
  for (const output of Array.isArray(result) ? result : [result]) {
    if (!isOutput(output)) {
      throw new Error("vite build が出力を返しませんでした");
    }
    for (const item of output.output) {
      files.push(
        item.type === "chunk"
          ? { name: item.fileName, content: item.code, sources: item.moduleIds }
          : { name: item.fileName, content: item.source, sources: item.originalFileNames },
      );
    }
  }
  return files;
}

// Bundler helpers that come from no file.
const bundlerModules = /^\0?(vite\/(preload-helper|modulepreload-polyfill)|rolldown\/runtime)/;
const shippedPackages = /\/node_modules\/(react|react-dom|scheduler)\//;

/**
 * Bundled code may come only from src/ (not tests), the entry, react, react-dom and scheduler.
 * ESLint and the type check do not see a file pulled in by ?url, ?raw or new URL(…, import.meta.url).
 */
export function provenanceProblems(root: string, entry: string, files: BuiltFile[]): string[] {
  const allowed = (source: string) => {
    const id = source.startsWith("/") || source.startsWith("\0") ? source : `${root}${source}`;
    return (
      id === entry ||
      bundlerModules.test(id) ||
      shippedPackages.test(id) ||
      (id.startsWith(`${root}src/`) && !id.includes("?") && !/\.test\.tsx?$/.test(id))
    );
  };
  return files.flatMap((file) =>
    file.sources
      .filter((source) => !allowed(source))
      .map((source) => `dist/${file.name} に ${source} が入っています。${readAdr0007}`),
  );
}

const bytesOf = (content: string | Uint8Array) =>
  typeof content === "string" ? new TextEncoder().encode(content) : content;

/** dist/ must hold exactly the expected files, byte for byte. */
export function reproductionProblems(
  expected: ReadonlyMap<string, string | Uint8Array>,
  actual: ReadonlyMap<string, Uint8Array>,
): string[] {
  const problems: string[] = [];
  for (const [name, content] of actual) {
    const want = expected.get(name);
    if (want === undefined) {
      problems.push(
        `dist/${name} は、決めた設定のビルドでは作られないファイルです。${readAdr0007}`,
      );
    } else if (!Buffer.from(bytesOf(want)).equals(content)) {
      problems.push(`dist/${name} が、決めた設定のビルドと違います。${readAdr0007}`);
    }
  }
  for (const name of expected.keys()) {
    if (!actual.has(name)) {
      problems.push(`dist/${name} がありません`);
    }
  }
  return problems;
}

// What the head of the shipped page may hold, tag by tag, with runs of whitespace made one space.
const headTags = [
  /^<meta charset="UTF-8" \/>$/,
  /^<meta name="viewport" content="[^"<>]*" \/>$/,
  /^<meta name="description" content="[^"<>]*" \/>$/,
  /^<title>[^<>]*<\/title>$/,
  /^<script type="module" crossorigin src="\/assets\/[\w-]+\.js"><\/script>$/,
  /^<link rel="stylesheet" crossorigin href="\/assets\/[\w-]+\.css">$/,
];
const bodyTags = new Set(
  "div main section header footer h1 h2 h3 p span strong em small ul ol li dl dt dd br output a label textarea input fieldset legend button".split(
    " ",
  ),
);
const bodyAttributes = new Set(
  "id class for href lang role hidden title rows type min max value name checked disabled inputmode spellcheck".split(
    " ",
  ),
);

/**
 * The shipped index.html, not the template: a script or style that Vite or prerender adds shows
 * up here. Head tags are an exact list; body tags and attributes are allowlists.
 */
export function htmlProblems(html: string): string[] {
  const problems: string[] = [];
  const head = /<head>([\s\S]*)<\/head>/.exec(html)?.[1];
  const body = /<body>([\s\S]*)<\/body>/.exec(html)?.[1];
  if (head === undefined || body === undefined) {
    return ["index.html に head と body がありません"];
  }
  const tags = head.match(/<title>[^<]*<\/title>|<script\b[^>]*><\/script>|<[^>]*>/g) ?? [];
  if (tags.join("").replace(/\s/g, "") !== head.replace(/\s/g, "")) {
    problems.push(`index.html の head に、タグのほかの文字があります。${readAdr0007}`);
  }
  for (const tag of tags.map((tag) => tag.replace(/\s+/g, " "))) {
    if (!headTags.some((pattern) => pattern.test(tag))) {
      problems.push(`index.html の head に ${tag} は入れられません。${readAdr0007}`);
    }
  }
  for (const [, name = "", attributes = ""] of body.matchAll(/<([a-zA-Z][\w-]*)([^>]*)>/g)) {
    if (!bodyTags.has(name.toLowerCase())) {
      problems.push(`index.html の body に <${name}> は入れられません。${readAdr0007}`);
    }
    // Chrome's enhanced spell check sends what is typed in a textarea to Google.
    if (name.toLowerCase() === "textarea" && !/\sspellcheck="false"/i.test(attributes)) {
      problems.push(`index.html の <textarea> に spellcheck="false" がありません。${readAdr0007}`);
    }
    for (const [, attribute = ""] of attributes.matchAll(/([^\s=/]+)(?:="[^"]*")?/g)) {
      if (!bodyAttributes.has(attribute.toLowerCase()) && !attribute.startsWith("aria-")) {
        problems.push(`index.html の <${name}> に ${attribute} は書けません。${readAdr0007}`);
      }
    }
  }
  return problems;
}

/** Built CSS requests nothing: no @import, and no url() other than data: URLs. */
export function cssProblems(name: string, css: string): string[] {
  const problems: string[] = [];
  if (/@import/i.test(css)) {
    problems.push(`dist/${name} に @import があります。${readAdr0007}`);
  }
  for (const [url] of css.matchAll(/url\(\s*(?!["']?data:)[^)]*\)/gi)) {
    problems.push(`dist/${name} の ${url} はリクエストになります。${readAdr0007}`);
  }
  return problems;
}
