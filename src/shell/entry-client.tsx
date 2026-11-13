import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "../app/App";
import "./index.css";

const root = document.getElementById("root");
if (root === null) {
  throw new Error("#root が index.html にありません");
}
const app = (
  <StrictMode>
    <App />
  </StrictMode>
);
// The dev server serves index.html as written, so #root holds only the placeholder comment
// and maybe the whitespace around it.
let isPrerendered = false;
for (const node of root.childNodes) {
  if (
    node.nodeType === Node.TEXT_NODE
      ? node.textContent?.trim() !== ""
      : node.nodeType !== Node.COMMENT_NODE
  ) {
    isPrerendered = true;
  }
}
if (isPrerendered) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
