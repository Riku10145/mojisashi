// stopped-by: no-restricted-syntax
type CookieJar = { cookie: string };
function jar(value: unknown): CookieJar;
function jar(value: unknown): unknown {
  return value;
}
export const leak = (text: string, value: unknown) => {
  jar(value).cookie = text;
};
