// stopped-by: @typescript-eslint/no-unused-vars
interface ObjectConstructor {
  jar(): { cookie: string };
}
export const leak = (text: string) => {
  Object.jar().cookie = text;
};
