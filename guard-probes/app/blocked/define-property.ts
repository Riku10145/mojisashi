// stopped-by: TS2584
export const leak = (k: string, text: string) => {
  Object.defineProperty(document, k, { value: text });
};
