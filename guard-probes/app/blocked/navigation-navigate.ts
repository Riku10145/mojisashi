// stopped-by: TS2304
export function send(text: string): void {
  navigation.navigate(`https://example.com/?q=${encodeURIComponent(text)}`);
}
