// stopped-by: TS2351
const key = "constructor";
export const leak = () => {
  const make = (() => 0)[key];
  return new make("return this");
};
