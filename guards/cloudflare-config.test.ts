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
});

/** Each X-Robots-Tag in _headers, with the URL pattern of the rule it belongs to. */
function robotsTags(text: string): [string, string][] {
  let pattern = "";
  return text.split("\n").flatMap((line): [string, string][] => {
    if (!/^\s/.test(line)) {
      pattern = line;
      return [];
    }
    const value = /^\s+X-Robots-Tag:\s*(.*?)\s*$/i.exec(line)?.[1];
    return value === undefined ? [] : [[pattern, value]];
  });
}

it("noindex は、本番ではない環境のホスト名だけに付ける", () => {
  // Production and dev publish the same _headers, so a noindex under /* would take mojisashi.app
  // out of search.
  const hidden = [...environments.values()]
    .filter(({ domain }) => domain !== production)
    .map(({ domain }): [string, string] => [`https://${domain}/*`, "noindex"]);
  expect(robotsTags(headers)).toEqual(hidden);
});

it("決めていない --mode は止める", async () => {
  await expect(
    resolveAndParseConfig(config, { isPreview: false, mode: "preview" }),
  ).rejects.toThrow("--mode");
});
