export function send(text: string): void {
  window.window.open(`https://example.com/?q=${encodeURIComponent(text)}`);
}
