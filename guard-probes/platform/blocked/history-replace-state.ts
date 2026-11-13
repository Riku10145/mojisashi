// stopped-by: local/browser
export function keep(text: string): void {
  history.replaceState({ text }, "", `?text=${encodeURIComponent(text)}`);
}
