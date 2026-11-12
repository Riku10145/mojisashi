import { readFile } from "node:fs/promises";
import { expect, test } from "vitest";
import { APP_HTML_PLACEHOLDER, injectAppHtml } from "./inject-app-html";

test("置き場所にアプリのHTMLを入れる", () => {
  expect(
    injectAppHtml(`<div id="root">${APP_HTML_PLACEHOLDER}</div>`, "<main><h1>見出し</h1></main>"),
  ).toBe('<div id="root"><main><h1>見出し</h1></main></div>');
});

test("アプリのHTMLに $& があっても、そのまま入れる", () => {
  expect(injectAppHtml(`<div>${APP_HTML_PLACEHOLDER}</div>`, "<p>$&</p>")).toBe(
    "<div><p>$&</p></div>",
  );
});

test("置き場所がなければ止める", () => {
  expect(() => injectAppHtml('<div id="root"></div>', "<main></main>")).toThrow(Error);
});

test("index.html に置き場所がある", async () => {
  const indexHtml = await readFile(new URL("../index.html", import.meta.url), "utf8");
  expect(indexHtml).toContain(APP_HTML_PLACEHOLDER);
});
