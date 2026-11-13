// stopped-by: TS2304
export function send(text: string): void {
  self.open(`https://example.com/?q=${encodeURIComponent(text)}`);
}
