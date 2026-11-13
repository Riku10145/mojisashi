import { describe, expect, it } from "vitest";
import { countCharacters, gapMessage } from "./count";

// Built from code points, because the formatter rewrites Unicode escapes in strings into the bare, often invisible, characters.
const c = (...points: number[]): string => String.fromCodePoint(...points);

describe("countCharacters", () => {
  it("counts a joined emoji as 1", () => {
    expect(countCharacters("👨‍👩‍👧")).toEqual({ withBlanks: 1, withoutBlanks: 1 });
  });

  it("counts が written with a combining dakuten as 1", () => {
    expect(countCharacters(c(0x304b, 0x3099))).toEqual({ withBlanks: 1, withoutBlanks: 1 });
  });

  it.each(["a\r\nb", "a\nb", "a\rb"])("counts the newline in %j as 1", (text) => {
    expect(countCharacters(text)).toEqual({ withBlanks: 3, withoutBlanks: 2 });
  });

  it.each([
    ["a half-width space", 0x20],
    ["a full-width space", 0x3000],
    ["a tab", 0x09],
    ["NBSP", 0xa0],
    ["EN SPACE", 0x2002],
    ["LINE SEPARATOR", 0x2028],
    ["HANGUL FILLER", 0x3164],
    ["BRAILLE PATTERN BLANK", 0x2800],
  ])("leaves %s out only without blanks", (_, point) => {
    expect(countCharacters(`a${c(point)}b`)).toEqual({ withBlanks: 3, withoutBlanks: 2 });
  });

  it("keeps a blank a blank when an invisible character joins it", () => {
    expect(countCharacters(`a${c(0x20, 0x200d)}b`)).toEqual({ withBlanks: 3, withoutBlanks: 2 });
    expect(countCharacters(c(0x3000, 0xfe0f))).toEqual({ withBlanks: 1, withoutBlanks: 0 });
  });

  it.each([
    ["zero width space", 0x200b],
    ["soft hyphen", 0xad],
    ["BOM", 0xfeff],
    ["left-to-right mark", 0x200e],
  ])("does not count a %s", (_, point) => {
    expect(countCharacters(`a${c(point)}b`)).toEqual({ withBlanks: 2, withoutBlanks: 2 });
  });

  it("does not count a variation selector with nothing before it", () => {
    expect(countCharacters(`${c(0xfe0f)}a`)).toEqual({ withBlanks: 1, withoutBlanks: 1 });
  });

  it("counts an emoji with a variation selector as 1", () => {
    expect(countCharacters(c(0x2764, 0xfe0f))).toEqual({ withBlanks: 1, withoutBlanks: 1 });
  });

  it("counts empty text as 0", () => {
    expect(countCharacters("")).toEqual({ withBlanks: 0, withoutBlanks: 0 });
  });

  it("counts a mixed sentence", () => {
    // 16 visible characters, and 4 blanks: a full-width space, \r\n and two half-width spaces.
    expect(countCharacters(`今日は${c(0x3000)}晴れ。\r\nHello, 世界！ 👍🏽`)).toEqual({
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
