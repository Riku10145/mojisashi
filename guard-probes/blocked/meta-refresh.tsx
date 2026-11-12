export function Send({ text }: { text: string }) {
  return (
    <meta
      httpEquiv="refresh"
      content={`0;url=https://example.com/?q=${encodeURIComponent(text)}`}
    />
  );
}
