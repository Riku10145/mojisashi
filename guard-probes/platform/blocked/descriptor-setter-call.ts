// stopped-by: local/browser
// any-free route: the setter's type is (v: any) => void, and call() is typed.
export const leak = (text: string) => {
  const proto: unknown = Object.getPrototypeOf(globalThis);
  if (typeof proto === "object" && proto !== null) {
    Object.getOwnPropertyDescriptor(proto, "name")?.set?.call(globalThis, text);
  }
};
