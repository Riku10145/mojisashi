import { expect, test } from "vitest";
import { injectAppHtml } from "./inject-app-html";

test("置き場所にアプリのHTMLを入れる", () => {
  expect(
    injectAppHtml('<div id="root"><!--app-html--></div>', "<main><h1>見出し</h1></main>"),
  ).toBe('<div id="root"><main><h1>見出し</h1></main></div>');
});

test("アプリのHTMLに $& があっても、そのまま入れる", () => {
  expect(injectAppHtml("<div><!--app-html--></div>", "<p>$&</p>")).toBe("<div><p>$&</p></div>");
});

test("置き場所がなければ止める", () => {
  expect(() => injectAppHtml('<div id="root"></div>', "<main></main>")).toThrow(Error);
});
