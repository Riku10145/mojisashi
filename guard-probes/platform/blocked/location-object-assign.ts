// stopped-by: local/browser
export function send(text: string): void {
  Object.assign(location, { href: `https://example.com/?q=${encodeURIComponent(text)}` });
}
