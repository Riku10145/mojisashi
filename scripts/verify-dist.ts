import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  assetNameProblems,
  canonicalProblems,
  cssProblems,
  htmlProblems,
  llmsProblems,
  previewProblems,
  provenanceProblems,
  referenceBuild,
  reproductionProblems,
} from "./dist-policy";
import { injectAppHtml } from "./inject-app-html";
import { pageUrl, pages } from "./pages";
import { renderApp } from "./render-app";

const root = fileURLToPath(new URL("../", import.meta.url));

async function filesUnder(dir: string): Promise<Map<string, Uint8Array>> {
  const files = new Map<string, Uint8Array>();
  for (const entry of await readdir(dir, { recursive: true, withFileTypes: true })) {
    if (entry.isFile()) {
      const path = `${entry.parentPath}/${entry.name}`;
      files.set(path.slice(dir.length).replace(/^\//, ""), await readFile(path));
    }
  }
  return files;
}

const built = await referenceBuild(root);
const expected = new Map<string, string | Uint8Array>(await filesUnder(`${root}public/`));
for (const file of built) {
  expected.set(file.name, file.content);
}
for (const { html, path } of pages) {
  const template = expected.get(html);
  if (typeof template !== "string") {
    throw new Error(`決めた設定のビルドが ${html} を作りませんでした`);
  }
  expected.set(html, injectAppHtml(template, await renderApp(root, path)));
}

const actual = await filesUnder(`${root}dist/`);
const decoder = new TextDecoder();
const shipped = new Map(
  pages.map(({ html, path }) => [pageUrl(path), { html, text: decoder.decode(actual.get(html)) }]),
);
const problems = [
  ...provenanceProblems(
    root,
    pages.map(({ html }) => `${root}${html}`),
    built,
  ),
  ...reproductionProblems(expected, actual),
  ...assetNameProblems(actual.keys()),
  ...[...shipped].flatMap(([url, { html, text }]) => [
    ...htmlProblems(text, html),
    ...canonicalProblems(text, url, html),
    ...previewProblems(text, html),
  ]),
  ...(actual.has("llms.txt")
    ? llmsProblems(
        decoder.decode(actual.get("llms.txt")),
        new Map([...shipped].map(([url, { text }]) => [url, text])),
      )
    : ["dist/llms.txt がありません"]),
  ...[...actual]
    .filter(([name]) => name.endsWith(".css"))
    .flatMap(([name, content]) => cssProblems(name, decoder.decode(content))),
];
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`dist/ の ${String(actual.size)} 個のファイルは、決めた設定のビルドと一致します`);
