import { describe, expect, it } from "vitest";
import { makeTestText } from "./generate";

/** Gives 0, 1, ..., 255, 0, 1, ... so every byte value comes up equally often. */
function everyByteInTurn(): (n: number) => Uint8Array {
  let next = 0;
  return (n) => Uint8Array.from({ length: n }, () => next++ % 256);
}

function noRandomness(): Uint8Array {
  throw new Error("日本語 asked for random bytes");
}

function letterCounts(text: string): Map<string, number> {
  const counts = new Map<string, number>();
  for (const letter of text) {
    counts.set(letter, (counts.get(letter) ?? 0) + 1);
  }
  return counts;
}

describe("makeTestText japanese", () => {
  it.each([1, 5, 6, 200, 100_000])("makes exactly %i characters of あいうえお", (length) => {
    const text = makeTestText("japanese", length, noRandomness);
    expect(text).toHaveLength(length);
    expect(text).toMatch(/^[あいうえお]+$/);
  });

  it("repeats あいうえお and cuts it at the length", () => {
    expect(makeTestText("japanese", 7, noRandomness)).toBe("あいうえおあい");
  });
});

describe("makeTestText english", () => {
  it.each([1, 200, 201, 100_000])("makes exactly %i letters a to z", (length) => {
    const text = makeTestText("english", length, everyByteInTurn());
    expect(text).toHaveLength(length);
    expect(text).toMatch(/^[a-z]+$/);
  });

  it("uses every letter equally when every byte is equally likely", () => {
    const counts = letterCounts(makeTestText("english", 26 * 9 * 100, everyByteInTurn()));
    expect(counts.size).toBe(26);
    expect(new Set(counts.values())).toEqual(new Set([900]));
  });

  it("asks for more bytes when some cannot be used", () => {
    const batches = [[255, 0, 234], [0, 255], [0]];
    const someUnusable = (n: number): Uint8Array => {
      const batch = batches.shift();
      if (batch === undefined) {
        throw new Error("asked for bytes after it had 3 letters");
      }
      return Uint8Array.from(batch.slice(0, n));
    };
    expect(makeTestText("english", 3, someUnusable)).toBe("aaa");
  });
});
