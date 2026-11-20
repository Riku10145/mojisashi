/**
 * A whole number from min to max, or undefined. Full-width digits count, as an IME types them,
 * and so do thousands separators in their places, as in 1,000.
 */
export function wholeNumberIn(raw: string, min: number, max: number): number | undefined {
  const written = raw.normalize("NFKC").trim();
  if (!/^(\d+|[1-9]\d{0,2}(,\d{3})+)$/.test(written)) {
    return undefined;
  }
  const value = Number(written.replaceAll(",", ""));
  return value >= min && value <= max ? value : undefined;
}

const numbers = new Intl.NumberFormat("ja-JP");

/** The numbers a field takes, shown before anything is typed so nobody learns it from a mistake. */
export function wholeNumberRange(min: number, max: number): string {
  return `${numbers.format(min)}から${numbers.format(max)}までの整数`;
}

/** What to tell someone whose field holds something other than a number from min to max. Nothing while the field is blank. */
export function wholeNumberHint(raw: string, min: number, max: number): string | undefined {
  if (raw.trim() === "" || wholeNumberIn(raw, min, max) !== undefined) {
    return undefined;
  }
  return `${wholeNumberRange(min, max)}を入れてください`;
}
