// stopped-by: local/browser
export function leak(this: Window, text: string) {
  this.name = text;
}
