// stopped-by: local/browser
export function send(text: string): void {
  new Image().src = `/pixel?t=${encodeURIComponent(text)}`;
}
