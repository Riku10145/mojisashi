import { expect, test } from "vitest";
import { wholeNumberIn } from "./index";

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
