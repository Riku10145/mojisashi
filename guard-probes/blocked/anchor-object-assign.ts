export function send(text: string): void {
  const link = document.querySelector("a");
  if (link !== null) {
    Object.assign(link, { href: `https://example.com/?q=${encodeURIComponent(text)}` });
    link.click();
  }
}
