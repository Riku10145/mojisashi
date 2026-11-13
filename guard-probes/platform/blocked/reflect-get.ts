// stopped-by: local/browser
export function keep(text: string): void {
  Reflect.set(document, "cookie", `text=${encodeURIComponent(text)}`);
}
