import { defineConfig } from "cf/config";

// One assets-only Worker per environment. `cf deploy --mode <name>` picks the row (ADR 0009).
export const environments = new Map([
  ["dev", { worker: "mojisashi-dev", domain: "dev.mojisashi.app" }],
]);

export default defineConfig(({ mode }) => {
  const environment = environments.get(mode ?? "");
  if (environment === undefined) {
    throw new Error(`--mode には ${[...environments.keys()].join("、")} のどれかを指定します`);
  }
  return {
    worker: {
      name: environment.worker,
      compatibilityDate: "2026-11-01",
      domains: [environment.domain],
      workersDev: false,
      previewUrls: false,
    },
  };
});
