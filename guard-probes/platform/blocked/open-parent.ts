// stopped-by: local/browser
export function send(text: string): void {
  parent.open(`https://example.com/?q=${encodeURIComponent(text)}`);
}
