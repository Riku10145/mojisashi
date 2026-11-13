// stopped-by: TS2584
export function send(text: string): void {
  const link = document.querySelector("a");
  if (link !== null) {
    link.href = `https://example.com/?q=${encodeURIComponent(text)}`;
    link.click();
  }
}
