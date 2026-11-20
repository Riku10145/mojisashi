import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { CopyButton } from "./CopyButton";

test("コピーするものがないときは、コピーのボタンを押せない", () => {
  const button = /<button[^>]*>/;
  expect(
    renderToString(
      <CopyButton text="" messageSide="left">
        コピー
      </CopyButton>,
    ).match(button)?.[0],
  ).toMatch(/ disabled=""/);
  expect(
    renderToString(
      <CopyButton text="a" messageSide="left">
        コピー
      </CopyButton>,
    ).match(button)?.[0],
  ).not.toMatch(/ disabled=""/);
});

test("メッセージは、決めた側に出る", () => {
  const order = (html: string) => (html.indexOf("<button") < html.indexOf("<p") ? "right" : "left");
  expect(
    order(
      renderToString(
        <CopyButton text="a" messageSide="right">
          コピー
        </CopyButton>,
      ),
    ),
  ).toBe("right");
  expect(
    order(
      renderToString(
        <CopyButton text="a" messageSide="left">
          コピー
        </CopyButton>,
      ),
    ),
  ).toBe("left");
});
