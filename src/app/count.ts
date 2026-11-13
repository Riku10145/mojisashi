export type CountingRule = "withoutBlanks" | "withBlanks";

export const countingRules: readonly { value: CountingRule; label: string }[] = [
  { value: "withoutBlanks", label: "空白と改行を除いた文字数" },
  { value: "withBlanks", label: "空白と改行を含む文字数" },
];

export type Counts = Readonly<Record<CountingRule, number>>;

const graphemes = new Intl.Segmenter("ja", { granularity: "grapheme" });
const blanks = new Set([" ", "　", "\t", "\n", "\r", "\r\n"]);
const numbers = new Intl.NumberFormat("ja-JP");

/** Counts each visible character once (ADR 0002), so \r\n is one newline. */
export function countCharacters(text: string): Counts {
  let withBlanks = 0;
  let withoutBlanks = 0;
  for (const { segment } of graphemes.segment(text)) {
    withBlanks += 1;
    if (!blanks.has(segment)) {
      withoutBlanks += 1;
    }
  }
  return { withBlanks, withoutBlanks };
}

export function formatNumber(n: number): string {
  return numbers.format(n);
}

export function gapMessage(target: number, count: number): string {
  return count <= target
    ? `あと${formatNumber(target - count)}文字`
    : `${formatNumber(count - target)}文字オーバー`;
}
