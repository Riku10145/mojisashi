// stopped-by: local/browser
export function send(text: string): void {
  navigation.navigate(`https://example.com/?q=${encodeURIComponent(text)}`);
}
