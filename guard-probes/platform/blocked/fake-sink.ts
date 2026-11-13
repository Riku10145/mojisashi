// stopped-by: local/browser
function createRoot(beacon: { sendBeacon: (url: string) => boolean }, text: string): void {
  beacon.sendBeacon(`/b?t=${text}`);
}

export function send(text: string): void {
  createRoot(navigator, text);
}
