// stopped-by: local/browser
export const leak = (text: string) => {
  const doc = Object.getOwnPropertyDescriptor(globalThis, "document")?.value;
  doc.cookie = text;
};
