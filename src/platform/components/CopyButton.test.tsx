import { MantineProvider } from "@mantine/core";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { expect, test } from "vitest";
import { CopyButton } from "./CopyButton";

const render = (node: ReactNode) =>
  renderToString(<MantineProvider withCssVariables={false}>{node}</MantineProvider>);

test("コピーするものがないときは、コピーのボタンを押せない", () => {
  const button = /<button[^>]*>/;
  expect(
    render(
      <CopyButton text="" messageSide="left">
        コピー
      </CopyButton>,
    ).match(button)?.[0],
  ).toMatch(/ disabled=""/);
  expect(
    render(
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
      render(
        <CopyButton text="a" messageSide="right">
          コピー
        </CopyButton>,
      ),
    ),
  ).toBe("right");
  expect(
    order(
      render(
        <CopyButton text="a" messageSide="left">
          コピー
        </CopyButton>,
      ),
    ),
  ).toBe("left");
});
