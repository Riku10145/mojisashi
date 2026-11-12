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
// The dev server serves index.html without the prerendered markup, so there is nothing to hydrate.
if (import.meta.env.DEV) {
  createRoot(root).render(app);
} else {
  hydrateRoot(root, app);
}
