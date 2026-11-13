// stopped-by: TS2304
export function send(text: string): void {
  Object.assign(location, { href: `https://example.com/?q=${encodeURIComponent(text)}` });
}
