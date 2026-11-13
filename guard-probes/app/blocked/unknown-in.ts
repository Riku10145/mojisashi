// stopped-by: TS2584
export function keep(text: string): void {
  const doc: unknown = document;
  if (typeof doc === "object" && doc !== null && "cookie" in doc) {
    Object.assign(doc, { cookie: text });
  }
}
