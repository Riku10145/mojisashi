// stopped-by: TS2584
export const leak = (text: string) => {
  const d = document;
  d["co" + "okie"] = text;
};
