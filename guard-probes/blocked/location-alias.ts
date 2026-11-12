export function send(text: string): void {
  const loc = window.location;
  loc.href = `https://example.com/?q=${encodeURIComponent(text)}`;
}
