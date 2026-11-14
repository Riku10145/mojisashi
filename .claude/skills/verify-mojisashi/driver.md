# drive.mjs

`drive.mjs` は、書き出した `dist/` を本番と同じ CSP の下で開き、手順のファイルを動かす道具です。使い方は [SKILL.md](SKILL.md) の Drive に書いています。リポジトリには JavaScript のファイルを置けないので、コードはこのブロックに置き、使うたびにスクラッチパッドへ取り出します。

道具を直すときは、このブロックを書き換え、取り出して動かし、`ALL PASS` になることを確かめます。

```js drive.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { extname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const [repoArg, evidenceArg, scenarioArg] = process.argv.slice(2);
if (!repoArg || !evidenceArg || !scenarioArg) {
  console.error("usage: node drive.mjs <repo> <evidence-dir> <scenario.mjs>");
  process.exit(2);
}
const repo = resolve(repoArg);
const evidence = resolve(evidenceArg);
const dist = join(repo, "dist");
const origin = "https://mojisashi.test";
await mkdir(evidence, { recursive: true });

const headersFile = await readFile(join(repo, "public/_headers"), "utf8");
// Only rules for a path apply here. A rule for another host, such as https://dev.mojisashi.app/*,
// never reaches production, so the page must not get it either.
const rules = [];
for (const line of headersFile.split("\n")) {
  if (!/^\s/.test(line)) {
    rules.push({ pattern: line.trim(), headers: {} });
  } else if (/^\s+\S+:/.test(line) && rules.at(-1)?.pattern.startsWith("/")) {
    const [name, ...rest] = line.trim().split(":");
    rules.at(-1).headers[name.trim()] = rest.join(":").trim();
  }
}
// A pattern is a path, or a path ending in * that matches everything below it.
const headersFor = (path) =>
  Object.assign(
    {},
    ...rules
      .filter(({ pattern }) =>
        pattern.endsWith("*") ? path.startsWith(pattern.slice(0, -1)) : path === pattern,
      )
      .map(({ headers }) => headers),
  );
if (!headersFor("/")["Content-Security-Policy"]) throw new Error("public/_headers has no CSP");

const types = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css" };
const log = { blockedRequests: [], consoleErrors: [], pageErrors: [], steps: [] };

const browser = await chromium.launch();
const context = await browser.newContext({ locale: "ja-JP" });
// Headless Chromium refuses navigator.clipboard and paste without these.
await context.grantPermissions(["clipboard-read", "clipboard-write"], { origin });
await context.route("**/*", async (route) => {
  const url = new URL(route.request().url());
  if (url.origin !== origin) {
    log.blockedRequests.push(route.request().url());
    return route.abort();
  }
  const headers = headersFor(url.pathname);
  const path = url.pathname === "/" ? "/index.html" : url.pathname;
  try {
    const body = await readFile(join(dist, path));
    return route.fulfill({
      status: 200,
      body,
      headers: { ...headers, "Content-Type": types[extname(path)] ?? "application/octet-stream" },
    });
  } catch {
    return route.fulfill({ status: 404, body: "not found", headers });
  }
});
const page = await context.newPage();
page.on("console", (message) => {
  if (message.type() === "error" || message.type() === "warning") {
    log.consoleErrors.push(`${message.type()}: ${message.text()}`);
  }
});
page.on("pageerror", (error) => log.pageErrors.push(String(error)));

async function open() {
  await page.goto(`${origin}/`, { waitUntil: "load" });
}

async function storage() {
  const cookies = await context.cookies();
  const web = await page.evaluate(async () => ({
    localStorage: localStorage.length,
    sessionStorage: sessionStorage.length,
    indexedDB: (await indexedDB.databases()).map((db) => db.name),
  }));
  return { cookies: cookies.length, ...web };
}

async function capture(name) {
  await page.screenshot({ path: join(evidence, `${name}.png`), fullPage: true });
  await writeFile(join(evidence, `${name}.aria.txt`), await page.locator("body").ariaSnapshot());
}

function step(name, ok, detail = "") {
  log.steps.push({ name, ok, detail });
  console.log(`${ok ? "PASS" : "FAIL"} ${name}${detail ? `  (${detail})` : ""}`);
}

const scenario = await import(pathToFileURL(resolve(scenarioArg)).href);
try {
  await open();
  await scenario.default({ page, open, storage, capture, step });
} catch (error) {
  step("scenario threw", false, String(error));
} finally {
  step("no request left the page's origin", log.blockedRequests.length === 0, log.blockedRequests.join(", "));
  step("no console error or warning (CSP violations land here)", log.consoleErrors.length === 0, log.consoleErrors.join(" | "));
  step("no uncaught page error", log.pageErrors.length === 0, log.pageErrors.join(" | "));
  await writeFile(join(evidence, "log.json"), JSON.stringify(log, null, 2));
  await browser.close();
}
const failed = log.steps.filter((s) => !s.ok).length;
console.log(`${failed === 0 ? "ALL PASS" : `${failed} FAILED`}; evidence in ${evidence}`);
process.exit(failed === 0 ? 0 : 1);
```
