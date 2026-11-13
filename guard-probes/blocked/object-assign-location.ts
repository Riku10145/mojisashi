export function send(text: string): void {
  Object.assign(document, { location: `https://example.com/?t=${encodeURIComponent(text)}` });
}
