import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
// Vite loads its config without TypeScript's resolution, so the import names the file.
import { pages } from "./scripts/pages.ts";

// scripts/verify-dist.ts rebuilds the page with its own copy of these options and fails the build
// when dist/ differs, so a change here must be made there too.
export default defineConfig({
  plugins: [react()],
  build: {
    assetsInlineLimit: 0,
    // The polyfill calls fetch(), which connect-src 'none' refuses; one chunk needs no preload.
    modulePreload: { polyfill: false },
    rolldownOptions: {
      input: pages.map(({ html }) => fileURLToPath(new URL(html, import.meta.url))),
    },
  },
});
