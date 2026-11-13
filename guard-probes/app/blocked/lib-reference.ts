// stopped-by: local/browser
/// <reference lib="dom" />
export const leak = (text: string) => {
  document.cookie = text;
};
