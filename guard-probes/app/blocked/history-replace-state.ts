// stopped-by: TS2304
export function keep(text: string): void {
  history.replaceState({ text }, "", `?text=${encodeURIComponent(text)}`);
}
