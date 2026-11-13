// stopped-by: local/browser
export const leak = (text: string) => {
  const d = document;
  d["co" + "okie"] = text;
};
