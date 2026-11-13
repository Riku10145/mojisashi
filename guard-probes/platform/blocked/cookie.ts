// stopped-by: local/browser
export const leak = (text: string) => {
  document.cookie = text;
};
