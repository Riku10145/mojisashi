import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { NumberField } from "./NumberField";

const render = (node: ReactNode) =>
  renderToString(<MantineProvider withCssVariables={false}>{node}</MantineProvider>);

test("範囲を伝える欄は、空のうちからページにあるので、文言が出たら読み上げられる", () => {
  const html = render(
    <NumberField label="目標の文字数" min={1} max={1_000_000} onNumber={() => undefined} />,
  );
  expect(html).toMatch(/<p [^>]*role="status"[^>]*><\/p>/);
});

test("入れられる範囲は、何も入れないうちから欄の上に出ていて、欄の名前にも入る", () => {
  const html = render(
    <NumberField label="作る文字数" min={1} max={100_000} onNumber={() => undefined} />,
  );
  const range =
    /<label for="([^"]+)"[^>]*>1から100,000までの整数<\/label>[\s\S]*?<input [^>]*id="([^"]+)"/.exec(
      html,
    );
  expect(range?.[1]).toBeDefined();
  expect(range?.[1]).toBe(range?.[2]);
});
