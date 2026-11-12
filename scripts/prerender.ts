import { injectAppHtml } from "./inject-app-html";

type EntryServer = { render: () => string };

function isEntryServer(mod: unknown): mod is EntryServer {
  return (
    typeof mod === "object" && mod !== null && "render" in mod && typeof mod.render === "function"
  );
}

const root = new URL("../", import.meta.url);
const templateFile = Bun.file(new URL("dist/index.html", root));
const entryServer: unknown = await import(new URL("dist-server/entry-server.js", root).href);
if (!isEntryServer(entryServer)) {
  throw new Error("dist-server/entry-server.js が render() を export していません");
}

await Bun.write(templateFile, injectAppHtml(await templateFile.text(), entryServer.render()));
