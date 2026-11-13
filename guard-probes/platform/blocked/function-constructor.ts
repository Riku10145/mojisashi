// stopped-by: @typescript-eslint/no-unsafe-return
export const leak = () => (() => 0).constructor("return this")();
