import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { TextBox } from "./TextBox";

const render = (node: ReactNode) =>
  renderToString(<MantineProvider withCssVariables={false}>{node}</MantineProvider>);

test("文章の入力欄は、スペルチェックで文章を送らない", () => {
  const html = render(<TextBox label="文章" text="" onText={() => undefined} />);
  expect(html).toMatch(/<textarea[^>]* spellcheck="false"/i);
});

test("文章の入力欄は、文章をブラウザのディスクに残させない", () => {
  const html = render(<TextBox label="文章" text="" onText={() => undefined} />);
  expect(html).toMatch(/<textarea[^>]* autocomplete="off"/i);
});
