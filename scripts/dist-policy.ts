import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { build, type Rolldown } from "vite";

const readAdr0007 = "docs/adr/0007-confine-browser-access.md を読んでください。";
const readAdr0015 = "docs/adr/0015-allow-tags-and-files-for-search.md を読んでください。";
const readAdr0019 = "docs/adr/0019-cache-hashed-assets-for-a-year.md を読んでください。";

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
      modulePreload: { polyfill: false },
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
  /^<link rel="canonical" href="https:\/\/mojisashi\.app\/" \/>$/,
  /^<meta property="og:url" content="https:\/\/mojisashi\.app\/" \/>$/,
  /^<meta (property="og|name="twitter):image" content="https:\/\/mojisashi\.app\/og\.png" \/>$/,
  /^<meta property="og:image:(width|height)" content="\d+" \/>$/,
  /^<meta property="og:(title|description|type|site_name|locale|image:alt)" content="[^"<>]*" \/>$/,
  /^<meta name="twitter:(card|title|description|image:alt)" content="[^"<>]*" \/>$/,
];
const jsonLd = /<script type="application\/ld\+json">([^<]*)<\/script>/;
const headToken = new RegExp(
  `${jsonLd.source}|<title>[^<]*<\\/title>|<script\\b[^>]*><\\/script>|<[^>]*>`,
  "g",
);
const wholeJsonLd = new RegExp(`^${jsonLd.source}$`);

function isJsonObject(text: string): boolean {
  try {
    const value: unknown = JSON.parse(text);
    return typeof value === "object" && value !== null && !Array.isArray(value);
  } catch {
    return false;
  }
}
const bodyTags = new Set(
  "div main section header footer h1 h2 h3 p span strong em small ul ol li dl dt dd br output a label textarea input fieldset legend button".split(
    " ",
  ),
);
const bodyAttributes = new Set(
  "id class for href lang role hidden title rows type min max value name checked disabled inputmode spellcheck autocomplete".split(
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
  const tags = head.match(headToken) ?? [];
  if (tags.join("").replace(/\s/g, "") !== head.replace(/\s/g, "")) {
    problems.push(`index.html の head に、タグのほかの文字があります。${readAdr0007}`);
  }
  for (const tag of tags) {
    const data = wholeJsonLd.exec(tag)?.[1];
    const flat = tag.replace(/\s+/g, " ");
    if (data !== undefined && !isJsonObject(data)) {
      problems.push(
        `index.html の JSON-LD が、JSON のオブジェクトとして読めません。${readAdr0015}`,
      );
    }
    if (data === undefined && !headTags.some((pattern) => pattern.test(flat))) {
      problems.push(`index.html の head に ${flat} は入れられません。${readAdr0007}`);
    }
  }
  for (const [, name = "", attributes = ""] of body.matchAll(/<([a-zA-Z][\w-]*)([^>]*)>/g)) {
    if (!bodyTags.has(name.toLowerCase())) {
      problems.push(`index.html の body に <${name}> は入れられません。${readAdr0007}`);
    }
    // Chrome's enhanced spell check sends what is typed in a textarea to Google, and without
    // autocomplete="off" Chrome writes it into the profile's Sessions files.
    for (const required of ['spellcheck="false"', 'autocomplete="off"']) {
      if (
        name.toLowerCase() === "textarea" &&
        !new RegExp(`\\s${required}`, "i").test(attributes)
      ) {
        problems.push(`index.html の <textarea> に ${required} がありません。${readAdr0007}`);
      }
    }
    for (const [, attribute = ""] of attributes.matchAll(/([^\s=/]+)(?:="[^"]*")?/g)) {
      if (!bodyAttributes.has(attribute.toLowerCase()) && !attribute.startsWith("aria-")) {
        problems.push(`index.html の <${name}> に ${attribute} は書けません。${readAdr0007}`);
      }
    }
  }
  return problems;
}

// The CSS functions whose argument is a URL. image-set() and src() take a string or var() as well,
// so a URL need not be spelled url(…).
const urlFunctions = /(?<![\w-])(?:-webkit-)?(?:image-set|image|cross-fade|element|src)\(/gi;

/** Built CSS requests nothing: no @import, no url() other than data: URLs, no other URL function. */
/** The page names its one right URL, so a copy with a query string or at /index.html is not a page of its own (#30). */
export function canonicalProblems(html: string): string[] {
  const count = html.match(/<link rel="canonical"/g)?.length ?? 0;
  return count === 1
    ? []
    : [`index.html の canonical は1つだけにします。いまは ${String(count)} 個です。${readAdr0015}`];
}

// Each link preview tag repeats what the page already says in <title> or the meta description.
// og:image:alt describes the image instead, so it is not checked.
const previewOf: Readonly<Record<string, "title" | "description">> = {
  'property="og:title"': "title",
  'name="twitter:title"': "title",
  'property="og:description"': "description",
  'name="twitter:description"': "description",
};

// JSON-LD keys whose values name a type, an identifier, a URL or a code rather than saying
// something to the reader. Every other string in the JSON-LD has to be text in the body.
const jsonLdKeysNotShown = new Set([
  "@context",
  "@type",
  "@id",
  "@language",
  "url",
  "inLanguage",
  "applicationCategory",
  "operatingSystem",
]);

function decoded(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

/**
 * The body's text as one string per run of text between tags, so a JSON-LD string cannot match
 * words from two elements. React's <!-- --> only splits text inside one element, so it joins.
 * Text in a hidden element still counts: telling it apart needs an HTML parser.
 */
function textRuns(html: string): string[] {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .split(/<[^>]*>/)
    .map(decoded);
}

function metaContents(head: string, attribute: string): string[] {
  return [...head.matchAll(new RegExp(`<meta\\s+${attribute}\\s+content="([^"]*)"`, "g"))].map(
    ([, content = ""]) => decoded(content),
  );
}

/** Every string the JSON-LD says to a reader. A featureList string is a comma-separated list. */
function shownStrings(value: unknown, key = ""): string[] {
  if (jsonLdKeysNotShown.has(key)) {
    return [];
  }
  if (typeof value === "string") {
    return key === "featureList" ? value.split(/\s*,\s*/) : [value];
  }
  if (Array.isArray(value)) {
    return value.flatMap((item: unknown) => shownStrings(item, key));
  }
  if (typeof value === "object" && value !== null) {
    return Object.entries(value).flatMap(([name, item]) => shownStrings(item, name));
  }
  return [];
}

/**
 * Link previews and structured data say what the page says (#33, #34): each og:* and twitter:*
 * title or description equals the <title> or the meta description, and each string the JSON-LD
 * says to a reader is text in the body. Run on the shipped page, whose body holds the rendered app.
 */
export function previewProblems(html: string): string[] {
  const head = /<head>([\s\S]*)<\/head>/.exec(html)?.[1] ?? "";
  const body = textRuns(/<body>([\s\S]*)<\/body>/.exec(html)?.[1] ?? "");
  const page = {
    title: decoded(/<title>([^<]*)<\/title>/.exec(head)?.[1] ?? ""),
    description: metaContents(head, 'name="description"')[0] ?? "",
  };
  const problems: string[] = [];
  for (const [attribute, said] of Object.entries(previewOf)) {
    for (const content of metaContents(head, attribute)) {
      if (content !== page[said]) {
        problems.push(
          `index.html の ${attribute} が、ページの ${said === "title" ? "title" : "meta description"} と違います。${readAdr0015}`,
        );
      }
    }
  }
  for (const [, data = ""] of head.matchAll(new RegExp(jsonLd.source, "g"))) {
    const value: unknown = isJsonObject(data) ? JSON.parse(data) : undefined;
    for (const text of shownStrings(value)) {
      if (!body.some((run) => run.includes(text))) {
        problems.push(
          `index.html の JSON-LD の「${text}」が、ページの本文にありません。${readAdr0015}`,
        );
      }
    }
  }
  return problems;
}

export function cssProblems(name: string, css: string): string[] {
  const problems: string[] = [];
  if (/@import/i.test(css)) {
    problems.push(`dist/${name} に @import があります。${readAdr0007}`);
  }
  for (const [url] of css.matchAll(/url\(\s*(?!["']?data:)[^)]*\)/gi)) {
    problems.push(`dist/${name} の ${url} はリクエストになります。${readAdr0007}`);
  }
  for (const [call] of css.matchAll(urlFunctions)) {
    problems.push(`dist/${name} の ${call} はリクエストになります。${readAdr0007}`);
  }
  return problems;
}

/**
 * _headers lets browsers keep everything under /assets/ for a year without asking again, which is
 * safe only while each name there carries a hash of its content (ADR 0019).
 */
export function assetNameProblems(names: Iterable<string>): string[] {
  return [...names]
    .filter((name) => name.startsWith("assets/") && !/^assets\/[\w-]+-[\w-]{8}\.\w+$/.test(name))
    .map((name) => `dist/${name} の名前に、中身のハッシュがありません。${readAdr0019}`);
}
