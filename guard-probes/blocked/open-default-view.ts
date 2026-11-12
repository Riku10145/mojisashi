export function send(text: string): void {
  document.defaultView?.open(`https://example.com/?q=${encodeURIComponent(text)}`);
}
