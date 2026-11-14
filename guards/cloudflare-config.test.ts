import { resolveAndParseConfig } from "@cloudflare/config";
import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import config, { environments } from "../cloudflare.config";
import { isRecord } from "./config-policy";

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

const buildOutputPackages = ["@cloudflare/build-output-utils", "@cloudflare/config"];

async function versionsIn(path: string, field: string): Promise<unknown[]> {
  const pkg: unknown = JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
  const dependencies = isRecord(pkg) ? pkg[field] : undefined;
  return buildOutputPackages.map((name) =>
    isRecord(dependencies) ? dependencies[name] : undefined,
  );
}

it("Build Output を書く @cloudflare/* は、cf と同じ版にする", async () => {
  // scripts/cloudflare-output.ts writes the Build Output that cf deploy --prebuilt reads, so both
  // must use one format. When cf moves past 1.0.0-beta.28, the script goes instead (ADR 0009).
  expect(await versionsIn("../package.json", "devDependencies")).toEqual(
    await versionsIn("../node_modules/cf/package.json", "dependencies"),
  );
});

it("決めていない --mode は止める", async () => {
  await expect(
    resolveAndParseConfig(config, { isPreview: false, mode: "preview" }),
  ).rejects.toThrow("--mode");
});
