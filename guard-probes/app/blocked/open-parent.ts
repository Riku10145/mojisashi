// stopped-by: TS2552
export function send(text: string): void {
  parent.open(`https://example.com/?q=${encodeURIComponent(text)}`);
}
