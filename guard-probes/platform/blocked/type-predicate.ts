// stopped-by: no-restricted-syntax
type CookieJar = { cookie: string };
function isJar(value: unknown): value is CookieJar {
  return typeof value === "object";
}
export const leak = (text: string, value: unknown) => {
  if (isJar(value)) value.cookie = text;
};
