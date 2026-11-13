import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { injectAppHtml } from "./inject-app-html";
import { renderApp } from "./render-app";

const root = fileURLToPath(new URL("../", import.meta.url));
const templateFile = `${root}dist/index.html`;
await writeFile(
  templateFile,
  injectAppHtml(await readFile(templateFile, "utf8"), await renderApp(root)),
);
