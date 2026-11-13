export function keep(text: string): void {
  const a = document.querySelector("a");
  if (a !== null) {
    a.hash = encodeURIComponent(text);
    a.click();
  }
}
