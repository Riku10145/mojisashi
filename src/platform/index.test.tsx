import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { TextBox, wholeNumberIn } from "./index";

test("範囲の中の整数を読む", () => {
  expect(wholeNumberIn("400", 1, 100_000)).toBe(400);
  expect(wholeNumberIn(" 400 ", 1, 100_000)).toBe(400);
});

test("全角の数字も読む", () => {
  expect(wholeNumberIn("４００", 1, 100_000)).toBe(400);
});

test("整数でない、または範囲の外なら undefined", () => {
  for (const raw of ["", "abc", "1.5", "-3", "0", "100001", "1e3"]) {
    expect(wholeNumberIn(raw, 1, 100_000)).toBeUndefined();
  }
});

test("文章の入力欄は、スペルチェックで文章を送らない", () => {
  const html = renderToString(<TextBox label="文章" text="" onText={() => undefined} />);
  expect(html).toMatch(/<textarea[^>]* spellcheck="false"/i);
});

// Fails until the box carries autocomplete="off": without it Chrome writes the 文章 into the
// profile's Sessions files and restores it after back and forward.
test.fails("文章の入力欄は、文章をブラウザのディスクに残させない", () => {
  const html = renderToString(<TextBox label="文章" text="" onText={() => undefined} />);
  expect(html).toMatch(/<textarea[^>]* autocomplete="off"/i);
});
