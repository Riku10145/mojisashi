export type CountingRule = "withoutBlanks" | "withBlanks";

export const countingRules: readonly { value: CountingRule; label: string }[] = [
  { value: "withoutBlanks", label: "空白と改行を除いた文字数" },
  { value: "withBlanks", label: "空白と改行を含む文字数" },
];

export type Counts = Readonly<Record<CountingRule, number>>;

type Kind = "visible" | "blank" | "invisible";

const counted: Readonly<Record<CountingRule, readonly Kind[]>> = {
  withoutBlanks: ["visible"],
  withBlanks: ["visible", "blank"],
};

const graphemes = new Intl.Segmenter("ja", { granularity: "grapheme" });
// Hangul fillers and the braille blank are letters to Unicode, but people use them as a blank.
// U+115F U+1160 is one grapheme, so a run of fillers is one blank.
const blank = /^(\p{Zs}|\p{Zl}|\p{Zp}|\t|\r\n|\r|\n|[\u115F\u1160\u2800\u3164\uFFA0]+)$/u;
const invisiblePart = /[\p{Cf}\p{Variation_Selector}\u034F]/gu;
const numbers = new Intl.NumberFormat("ja-JP");

/** A grapheme is a blank when it looks like one, and invisible when it shows nothing (ADR 0008). */
function kindOf(grapheme: string): Kind {
  const shown = grapheme.replace(invisiblePart, "");
  if (shown === "") {
    return "invisible";
  }
  return blank.test(shown) ? "blank" : "visible";
}

/** Counts each visible character once (ADR 0002), so \r\n is one newline. */
export function countCharacters(text: string): Counts {
  const counts: Record<CountingRule, number> = { withoutBlanks: 0, withBlanks: 0 };
  for (const { segment } of graphemes.segment(text)) {
    const kind = kindOf(segment);
    for (const { value } of countingRules) {
      if (counted[value].includes(kind)) {
        counts[value] += 1;
      }
    }
  }
  return counts;
}

export function formatNumber(n: number): string {
  return numbers.format(n);
}

export function gapMessage(target: number, count: number): string {
  return count <= target
    ? `あと${formatNumber(target - count)}文字`
    : `${formatNumber(count - target)}文字オーバー`;
}
