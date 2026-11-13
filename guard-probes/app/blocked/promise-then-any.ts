// stopped-by: local/browser
export const leak = (text: string) =>
  import("react").then((m) => m.createElement("script", null, text));
