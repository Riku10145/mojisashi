type EntryServer = { render: (path: string) => string };

function isEntryServer(mod: unknown): mod is EntryServer {
  return (
    typeof mod === "object" && mod !== null && "render" in mod && typeof mod.render === "function"
  );
}

/** The HTML of the page at path from src/shell/entry-server.tsx, as prerender writes it into dist/. */
export async function renderApp(root: string, path: string): Promise<string> {
  // A URL import keeps src/ out of this tsconfig project, so the module stays unknown until checked.
  const entryServer: unknown = await import(
    new URL("src/shell/entry-server.tsx", `file://${root}`).href
  );
  if (!isEntryServer(entryServer)) {
    throw new Error("src/shell/entry-server.tsx が render() を export していません");
  }
  return entryServer.render(path);
}
