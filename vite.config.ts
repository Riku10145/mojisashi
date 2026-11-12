import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig, type Plugin } from "vite";

const guardProbes = fileURLToPath(new URL("guard-probes/", import.meta.url));

// ESLint skips guard-probes, so the page must never load code from there.
const keepGuardProbesOut: Plugin = {
  name: "keep-guard-probes-out",
  load(id) {
    if (id.startsWith(guardProbes)) {
      this.error(`${id} は ESLint の守りを試すためのコードなので、ページに入れられません。`);
    }
  },
};

export default defineConfig({
  plugins: [keepGuardProbesOut, react(), tailwindcss()],
});
