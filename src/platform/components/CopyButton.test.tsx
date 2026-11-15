import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { CopyButton } from "./CopyButton";

test("コピーするものがないときは、コピーのボタンを押せない", () => {
  const button = /<button[^>]*>/;
  expect(renderToString(<CopyButton text="">コピー</CopyButton>).match(button)?.[0]).toMatch(
    / disabled=""/,
  );
  expect(renderToString(<CopyButton text="a">コピー</CopyButton>).match(button)?.[0]).not.toMatch(
    / disabled=""/,
  );
});
