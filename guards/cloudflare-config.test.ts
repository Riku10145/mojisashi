import { resolveAndParseConfig } from "@cloudflare/config";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import config, { environments } from "../cloudflare.config";

const production = "mojisashi.app";
const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");

describe.each([...environments])("cloudflare.config.ts の %s", (mode, environment) => {
  it("静的なファイルだけを、決めたドメインだけで返す", async () => {
    const parsed = await resolveAndParseConfig(config, { isPreview: false, mode });
    if (!parsed.success) {
      throw parsed.error;
    }
    // _headers, and so the CSP, does not apply to what a Worker script returns (ADR 0009). The
    // compatibility date only changes how a script runs.
    expect({ ...parsed.data.worker, compatibilityDate: undefined }).toEqual({
      name: environment.worker,
      domains: [environment.domain],
      workersDev: false,
      previewUrls: false,
    });
    expect(parsed.data.containers).toEqual([]);
  });

  it.skipIf(environment.domain === production)("検索に載せない", () => {
    expect(headers).toContain(`\nhttps://${environment.domain}/*\n  X-Robots-Tag: noindex\n`);
  });
});

it("決めていない --mode は止める", async () => {
  await expect(
    resolveAndParseConfig(config, { isPreview: false, mode: "preview" }),
  ).rejects.toThrow("--mode");
});
