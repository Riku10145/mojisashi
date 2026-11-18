import { expect, test } from "vitest";
import { render } from "./entry-server";

test("書き出すHTMLに見出しが入る", () => {
  expect(render("/")).toMatch(/<h1[^>]*>文字数カウント<\/h1>/);
});

test("書き出すHTMLに、道具の説明、数え方、よくある質問が入る", () => {
  const html = render("/");
  expect(html).toContain("mojisashi（もじさし）は");
  expect(html).toMatch(/<h2[^>]*>数え方<\/h2>/);
  expect(html).toMatch(/<h2[^>]*>よくある質問<\/h2>/);
  expect(html).toMatch(/<h3[^>]*>貼った文章は、どこかに送られますか？<\/h3>/);
});

test("決めていないパスは書き出さない", () => {
  expect(() => render("/dummy-text/")).toThrow("/dummy-text/ のページはありません");
});
