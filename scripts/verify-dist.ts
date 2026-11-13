import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import {
  cssProblems,
  htmlProblems,
  provenanceProblems,
  referenceBuild,
  reproductionProblems,
} from "./dist-policy";
import { injectAppHtml } from "./inject-app-html";
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
const template = expected.get("index.html");
if (typeof template !== "string") {
  throw new Error("決めた設定のビルドが index.html を作りませんでした");
}
expected.set("index.html", injectAppHtml(template, await renderApp(root)));

const actual = await filesUnder(`${root}dist/`);
const decoder = new TextDecoder();
const problems = [
  ...provenanceProblems(root, `${root}index.html`, built),
  ...reproductionProblems(expected, actual),
  ...htmlProblems(decoder.decode(actual.get("index.html"))),
  ...[...actual]
    .filter(([name]) => name.endsWith(".css"))
    .flatMap(([name, content]) => cssProblems(name, decoder.decode(content))),
];
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`dist/ の ${String(actual.size)} 個のファイルは、決めた設定のビルドと一致します`);
