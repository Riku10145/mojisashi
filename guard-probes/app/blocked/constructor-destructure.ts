// stopped-by: no-restricted-globals
const { constructor: make } = () => 0;
export const leak = () => Reflect.apply(Reflect.construct(make, ["return this"]), undefined, []);
