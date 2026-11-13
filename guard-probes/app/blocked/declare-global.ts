// stopped-by: local/browser
declare global {
  var document: { cookie: string };
}
export const leak = (text: string) => {
  document.cookie = text;
};
