import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// scripts/verify-dist.ts rebuilds the page with its own copy of these options and fails the build
// when dist/ differs, so a change here must be made there too.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    assetsInlineLimit: 0,
    // The polyfill calls fetch(), which connect-src 'none' refuses; one chunk needs no preload.
    modulePreload: { polyfill: false },
  },
});
