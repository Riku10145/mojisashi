export function Share({ text }: { text: string }) {
  return <a href={`https://example.com/?q=${encodeURIComponent(text)}`}>共有</a>;
}
