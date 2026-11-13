// stopped-by: local/browser
export const leak = (k: string, text: string) => {
  Object.defineProperty(document, k, { value: text });
};
