// stopped-by: local/browser
export function keep(text: string): void {
  const store: unknown = eval("localStorage");
  if (store instanceof Storage) {
    store.setItem("text", text);
  }
}
