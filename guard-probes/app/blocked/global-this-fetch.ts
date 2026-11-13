// stopped-by: TS7017
export const leak = (text: string) => globalThis.fetch(`/p?t=${text}`);
