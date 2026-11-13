export function send(text: string): void {
  const a = document.querySelector("a");
  if (a !== null) {
    a.search = `?t=${encodeURIComponent(text)}`;
    a.click();
  }
}
