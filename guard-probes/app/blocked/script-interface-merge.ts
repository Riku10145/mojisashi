// stopped-by: TS2339
interface ObjectConstructor {
  jar(): { cookie: string };
}
export const leak = (text: string) => {
  Object.jar().cookie = text;
};
