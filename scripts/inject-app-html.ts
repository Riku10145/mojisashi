export const APP_HTML_PLACEHOLDER = "<!--app-html-->";

export function injectAppHtml(template: string, appHtml: string): string {
  if (!template.includes(APP_HTML_PLACEHOLDER)) {
    throw new Error(`${APP_HTML_PLACEHOLDER} が HTML にありません`);
  }
  // A replacer function keeps `$&` and similar patterns in the rendered HTML literal.
  return template.replace(APP_HTML_PLACEHOLDER, () => appHtml);
}
