const letters = "abcdefghijklmnopqrstuvwxyz";
// 256 is not a multiple of 26, so byte % 26 would favor a to v. Bytes from 234 (26 * 9) up are dropped.
const usable = letters.length * Math.floor(256 / letters.length);

export const maxTestTextLength = 100_000;

/** A テスト用の文章 of exactly `length` letters a to z, each equally likely. */
export function makeTestText(length: number, randomBytes: (n: number) => Uint8Array): string {
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
