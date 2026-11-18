import { renderToString } from "react-dom/server";
import { pageAt } from "./pages";

export function render(path: string): string {
  return renderToString(pageAt(path));
}
