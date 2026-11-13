export function send(text: string): void {
  const el = document.querySelector("p");
  if (el !== null) {
    Object.assign(el, {
      innerHTML: `<meta http-equiv="refresh" content="0;url=https://example.com/?t=${encodeURIComponent(text)}">`,
    });
  }
}
