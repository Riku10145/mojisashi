// stopped-by: TS2304
export function send(text: string): void {
  void fetch(`https://example.com/?q=${encodeURIComponent(text)}`);
}
