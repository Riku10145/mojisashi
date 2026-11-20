import { expect, test } from "vitest";
import { render } from "./entry-server";

test("書き出すHTMLに見出しが入る", () => {
  expect(render("/")).toMatch(/<h1[^>]*>文字数カウント<\/h1>/);
  expect(render("/dummy-text/")).toMatch(/<h1[^>]*>テスト用の文章を作る<\/h1>/);
});

test("トップのHTMLに、道具の説明、数え方、よくある質問、作るページへのリンクが入る", () => {
  const html = render("/");
  expect(html).toContain("mojisashi（もじさし）は");
  expect(html).toMatch(/<h2[^>]*>数え方<\/h2>/);
  expect(html).toMatch(/<h2[^>]*>よくある質問<\/h2>/);
  expect(html).toMatch(/<summary[^>]*>貼った文章は、どこかに送られますか？<\/summary>/);
  expect(html).toMatch(/<a [^>]*href="\/dummy-text\/"[^>]*>テスト用の文章を作る<\/a>/);
  expect(html).not.toContain("作る文字数");
});

test("作るページのHTMLに、作る機能、よくある質問、トップへのリンクが入る", () => {
  const html = render("/dummy-text/");
  expect(html).toContain("作る文字数");
  expect(html).toMatch(/<h2[^>]*>よくある質問<\/h2>/);
  expect(html).toMatch(/<a [^>]*href="\/"[^>]*>文字数カウント<\/a>/);
  expect(html).not.toMatch(/<textarea/);
});

test("決めていないパスは書き出さない", () => {
  expect(() => render("/dummy-text")).toThrow("/dummy-text のページはありません");
});

test("書き出すHTMLに style の属性を残さない。CSP が止めるため", () => {
  for (const path of ["/", "/dummy-text/"]) {
    expect(render(path)).not.toMatch(/<[^>]* style="/);
  }
});
