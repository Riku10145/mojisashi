import { describe, expect, it } from "vitest";
import { countCharacters, gapMessage } from "./count";

describe("countCharacters", () => {
  it("counts a joined emoji as 1", () => {
    expect(countCharacters("👨‍👩‍👧")).toEqual({ withBlanks: 1, withoutBlanks: 1 });
  });

  it("counts が written with a combining dakuten as 1", () => {
    expect(countCharacters("が")).toEqual({ withBlanks: 1, withoutBlanks: 1 });
  });

  it.each(["a\r\nb", "a\nb", "a\rb"])("counts the newline in %j as 1", (text) => {
    expect(countCharacters(text)).toEqual({ withBlanks: 3, withoutBlanks: 2 });
  });

  it.each([" ", "　", "\t"])("leaves %j out only without blanks", (blank) => {
    expect(countCharacters(`a${blank}b`)).toEqual({ withBlanks: 3, withoutBlanks: 2 });
  });

  it("counts empty text as 0", () => {
    expect(countCharacters("")).toEqual({ withBlanks: 0, withoutBlanks: 0 });
  });

  it("counts a mixed sentence", () => {
    // 今日は 晴れ。 Hello, 世界！ 👍🏽 are 16 characters; the four blanks are a full-width space, \r\n and two half-width spaces.
    expect(countCharacters("今日は　晴れ。\r\nHello, 世界！ 👍🏽")).toEqual({
      withBlanks: 20,
      withoutBlanks: 16,
    });
  });
});

describe("gapMessage", () => {
  it("says how many characters are left", () => {
    expect(gapMessage(400, 390)).toBe("あと10文字");
  });

  it("says 0 are left at the target", () => {
    expect(gapMessage(400, 400)).toBe("あと0文字");
  });

  it("says how many characters are over", () => {
    expect(gapMessage(400, 412)).toBe("12文字オーバー");
  });

  it("separates thousands", () => {
    expect(gapMessage(1000, 0)).toBe("あと1,000文字");
  });
});
