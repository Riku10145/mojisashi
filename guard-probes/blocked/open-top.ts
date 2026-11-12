export function send(text: string): void {
  top?.open(`https://example.com/?q=${encodeURIComponent(text)}`);
}
