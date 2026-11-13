// stopped-by: local/browser
export function keep(text: string): void {
  const jar: { cookie: string } = document;
  jar.cookie = text;
}
