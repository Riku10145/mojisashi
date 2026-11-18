import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { injectAppHtml } from "./inject-app-html";
import { pages } from "./pages";
import { renderApp } from "./render-app";

const root = fileURLToPath(new URL("../", import.meta.url));
for (const { html, path } of pages) {
  const templateFile = `${root}dist/${html}`;
  await writeFile(
    templateFile,
    injectAppHtml(await readFile(templateFile, "utf8"), await renderApp(root, path)),
  );
}
