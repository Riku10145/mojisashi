// stopped-by: TS2304
export function keep(text: string): void {
  localStorage.setItem("text", text);
}
