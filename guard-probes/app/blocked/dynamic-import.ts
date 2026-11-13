// stopped-by: no-restricted-syntax
export async function send(text: string): Promise<void> {
  await import(/* @vite-ignore */ `/m.js?t=${encodeURIComponent(text)}`);
}
