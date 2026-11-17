import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import config, { environments } from "../cloudflare.config";

const production = "mojisashi.app";
const headers = await readFile(new URL("../public/_headers", import.meta.url), "utf8");

describe.each([...environments])("cloudflare.config.ts の %s", (mode, environment) => {
  it("静的なファイルだけを、決めたドメインだけで返す", () => {
    const { worker, ...rest } = config({ isPreview: false, mode });
    // _headers, and so the CSP, does not apply to what a Worker script returns (ADR 0009). The
    // compatibility date only changes how a script runs. Any other key, such as containers or
    // bindings, fails here.
    expect(rest).toEqual({});
    expect({ ...worker, compatibilityDate: undefined }).toEqual({
      name: environment.worker,
      domains: [environment.domain],
      workersDev: false,
      previewUrls: false,
    });
  });
});

/** Each header in _headers as [URL pattern of its rule, header name in lower case, value]. */
function headerRules(text: string): [string, string, string][] {
  let pattern = "";
  return text.split("\n").flatMap((line): [string, string, string][] => {
    if (!/^\s/.test(line)) {
      pattern = line;
      return [];
    }
    const header = /^\s+([\w-]+):\s*(.*?)\s*$/.exec(line);
    return header === null ? [] : [[pattern, (header[1] ?? "").toLowerCase(), header[2] ?? ""]];
  });
}

function rulesFor(name: string): [string, string][] {
  return headerRules(headers)
    .filter(([, header]) => header === name)
    .map(([pattern, , value]) => [pattern, value]);
}

it("noindex は、本番ではない環境のホスト名だけに付ける", () => {
  // Production and dev publish the same _headers, so a noindex under /* would take mojisashi.app
  // out of search.
  const hidden = [...environments.values()]
    .filter(({ domain }) => domain !== production)
    .map(({ domain }): [string, string] => [`https://${domain}/*`, "noindex"]);
  expect(rulesFor("x-robots-tag")).toEqual(hidden);
});

it("HTML だけは、Cloudflare に書き換えさせない", () => {
  // Cloudflare injects its RUM script into HTML unless the response has no-transform, which also
  // stops compression. So only the page at / gets it, and JS and CSS stay compressed (ADR 0010).
  expect(rulesFor("cache-control")).toEqual([
    ["/", "public, max-age=0, must-revalidate, no-transform"],
  ]);
});

it("決めていない --mode は止める", () => {
  expect(() => config({ isPreview: false, mode: "preview" })).toThrow("--mode");
});
