// stopped-by: TS2584
export const leak = (text: string) => {
  document.cookie = text;
};
