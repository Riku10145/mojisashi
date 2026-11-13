// stopped-by: local/browser
export const leak = (text: string) => globalThis.fetch(`/p?t=${text}`);
