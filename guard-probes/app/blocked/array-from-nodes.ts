// stopped-by: TS2584
export function send(text: string): void {
  for (const a of Array.from(document.querySelectorAll("a"))) {
    a.search = text;
  }
}
