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
