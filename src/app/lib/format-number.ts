const numbers = new Intl.NumberFormat("ja-JP");

export function formatNumber(n: number): string {
  return numbers.format(n);
}
