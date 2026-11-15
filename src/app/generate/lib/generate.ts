export type TestTextKind = "japanese" | "english";

export const testTextKinds: readonly { value: TestTextKind; label: string }[] = [
  { value: "japanese", label: "日本語（あいうえおのくり返し）" },
  { value: "english", label: "英語（aからzをランダムに並べる）" },
];

export const maxTestTextLength = 100_000;

type RandomBytes = (n: number) => Uint8Array;

const kana = "あいうえお";

function makeJapanese(length: number): string {
  return kana.repeat(Math.ceil(length / kana.length)).slice(0, length);
}

const letters = "abcdefghijklmnopqrstuvwxyz";
// 256 is not a multiple of 26, so byte % 26 would favor a to v. Bytes from 234 (26 * 9) up are dropped.
const usable = letters.length * Math.floor(256 / letters.length);

/** Each letter a to z is equally likely. */
function makeEnglish(length: number, randomBytes: RandomBytes): string {
  const chosen: string[] = [];
  while (chosen.length < length) {
    for (const byte of randomBytes(length - chosen.length)) {
      if (byte < usable) {
        chosen.push(letters.charAt(byte % letters.length));
      }
    }
  }
  return chosen.join("");
}

const makers: Readonly<Record<TestTextKind, (length: number, randomBytes: RandomBytes) => string>> =
  {
    japanese: makeJapanese,
    english: makeEnglish,
  };

/** A テスト用の文章 of exactly `length` characters of the chosen 文字の種類. */
export function makeTestText(kind: TestTextKind, length: number, randomBytes: RandomBytes): string {
  return makers[kind](length, randomBytes);
}
