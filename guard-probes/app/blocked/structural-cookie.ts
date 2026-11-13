// stopped-by: TS2584
export function keep(text: string): void {
  const jar: { cookie: string } = document;
  jar.cookie = text;
}
