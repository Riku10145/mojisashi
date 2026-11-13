// stopped-by: local/browser
export function show(element: HTMLElement, text: string): void {
  const parsed = new DOMParser().parseFromString(text, "text/html");
  element.append(...parsed.body.childNodes);
}
