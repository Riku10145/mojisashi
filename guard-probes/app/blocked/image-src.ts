// stopped-by: TS2304
export function send(text: string): void {
  new Image().src = `/pixel?t=${encodeURIComponent(text)}`;
}
