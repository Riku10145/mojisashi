import { readFile, writeFile } from "node:fs/promises";
import { injectAppHtml } from "./inject-app-html";

type EntryServer = { render: () => string };

function isEntryServer(mod: unknown): mod is EntryServer {
  return (
    typeof mod === "object" && mod !== null && "render" in mod && typeof mod.render === "function"
  );
}

const root = new URL("../", import.meta.url);
const templateFile = new URL("dist/index.html", root);
// A URL import keeps src/ out of this tsconfig project, so the module stays unknown until checked.
const entryServer: unknown = await import(new URL("src/entry-server.tsx", root).href);
if (!isEntryServer(entryServer)) {
  throw new Error("src/entry-server.tsx が render() を export していません");
}

await writeFile(
  templateFile,
  injectAppHtml(await readFile(templateFile, "utf8"), entryServer.render()),
);
