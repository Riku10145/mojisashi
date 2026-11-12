import { StrictMode } from "react";
import { createRoot, hydrateRoot } from "react-dom/client";
import { App } from "./App";
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
// The dev server serves index.html as written, so #root holds only the placeholder comment.
const isPrerendered = Array.from(root.childNodes).some(
  (node) => node.nodeType !== Node.COMMENT_NODE,
);
if (isPrerendered) {
  hydrateRoot(root, app);
} else {
  createRoot(root).render(app);
}
