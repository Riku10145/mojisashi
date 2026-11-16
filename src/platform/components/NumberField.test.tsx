import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { NumberField } from "./NumberField";

test("範囲を伝える欄は、空のうちからページにあるので、文言が出たら読み上げられる", () => {
  const html = renderToString(
    <NumberField label="目標の文字数" min={1} max={1_000_000} onNumber={() => undefined} />,
  );
  expect(html).toMatch(/<p role="status"[^>]*><\/p>/);
});
