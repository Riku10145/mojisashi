import { expect, test } from "vitest";
import { render } from "./entry-server";

test("書き出すHTMLに見出しが入る", () => {
  expect(render()).toMatch(/<h1[^>]*>文字数カウント<\/h1>/);
});
