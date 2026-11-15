import { expect, test } from "vitest";
import { wholeNumberIn } from "./whole-number";

test("範囲の中の整数を読む", () => {
  expect(wholeNumberIn("400", 1, 100_000)).toBe(400);
  expect(wholeNumberIn(" 400 ", 1, 100_000)).toBe(400);
});

test("全角の数字も読む", () => {
  expect(wholeNumberIn("４００", 1, 100_000)).toBe(400);
});

test("桁区切りのカンマも読む", () => {
  expect(wholeNumberIn("1,000", 1, 1_000_000)).toBe(1000);
  expect(wholeNumberIn("10,000", 1, 1_000_000)).toBe(10_000);
  expect(wholeNumberIn("100,000", 1, 1_000_000)).toBe(100_000);
  expect(wholeNumberIn("１，０００，０００", 1, 1_000_000)).toBe(1_000_000);
});

test("整数でない、または範囲の外なら undefined", () => {
  for (const raw of [
    "",
    "abc",
    "1.5",
    "-3",
    "0",
    "100001",
    "1e3",
    "1,00",
    "10,00,0",
    ",100",
    "0,001",
    "000,400",
  ]) {
    expect(wholeNumberIn(raw, 1, 100_000)).toBeUndefined();
  }
});
