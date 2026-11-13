// stopped-by: TS2304
export function leak(this: Window, text: string) {
  this.name = text;
}
