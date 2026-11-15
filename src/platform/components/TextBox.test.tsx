import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { TextBox } from "./TextBox";

test("文章の入力欄は、スペルチェックで文章を送らない", () => {
  const html = renderToString(<TextBox label="文章" text="" onText={() => undefined} />);
  expect(html).toMatch(/<textarea[^>]* spellcheck="false"/i);
});

test("文章の入力欄は、文章をブラウザのディスクに残させない", () => {
  const html = renderToString(<TextBox label="文章" text="" onText={() => undefined} />);
  expect(html).toMatch(/<textarea[^>]* autocomplete="off"/i);
});
