// stopped-by: @typescript-eslint/no-unsafe-return
const key = "constructor";
export const leak = () => {
  const make = (() => 0)[key];
  return new make("return this");
};
