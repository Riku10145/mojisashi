import { renderToString } from "react-dom/server";
import { pageAt } from "./pages";

/**
 * The page as Mantine renders it, with each element's inline style. CSP's style-src 'self' refuses
 * a style attribute in HTML, so mantine-styles.css holds the same declarations (ADR 0022).
 */
export function renderWithStyles(path: string): string {
  return renderToString(pageAt(path));
}

/**
 * The page's HTML without style attributes. React escapes " in text and in attribute values, so
 * ' style="' starts an attribute. Hydration leaves the attributes out, and React sets a style that
 * changes later through the CSSOM, which the CSP allows.
 */
export function render(path: string): string {
  return renderWithStyles(path).replace(/ style="[^"]*"/g, "");
}
