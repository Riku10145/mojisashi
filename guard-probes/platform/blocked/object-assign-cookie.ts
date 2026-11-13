// stopped-by: local/browser
export function keep(text: string): void {
  Object.assign(document, { cookie: `t=${encodeURIComponent(text)}; max-age=999999; path=/` });
}
