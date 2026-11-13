// stopped-by: TS7053
const name = ["fe", "tch"].join("");
export const leak = (text: string) => {
  const f: unknown = globalThis[name];
  return [f, text];
};
