// stopped-by: TS2584
export function keep(text: string): void {
  Reflect.set(document, "cookie", `text=${encodeURIComponent(text)}`);
}
