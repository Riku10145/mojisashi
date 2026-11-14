// Writes cf's Build Output for one environment of cloudflare.config.ts from the built dist/, so
// `cf deploy --prebuilt` uploads it without building. cf 1.0.0-beta.29 does the same itself with
// `cf deploy dist`; this file goes when cf is updated to it. Until then @cloudflare/config and
// @cloudflare/build-output-utils stay at the versions cf depends on, so both read one format.
import {
  cleanBuildOutputDir,
  writeAssets,
  writeRootConfig,
  writeWorkerConfig,
} from "@cloudflare/build-output-utils";
import { InputSettingsSchema, resolveAndParseConfig } from "@cloudflare/config";
import { fileURLToPath } from "node:url";
import config from "../cloudflare.config";

const root = fileURLToPath(new URL("../", import.meta.url));
const context = { isPreview: false, mode: process.argv[2] };
const parsed = await resolveAndParseConfig(config, context);
if (!parsed.success) {
  throw new Error(`cloudflare.config.ts が読めません: ${parsed.error.message}`);
}
const { worker } = parsed.data;
if (worker === undefined) {
  throw new Error("cloudflare.config.ts に worker がありません");
}
await cleanBuildOutputDir(root);
await writeRootConfig(root, InputSettingsSchema.parse(parsed.data), context);
await writeWorkerConfig({ root, config: worker });
await writeAssets({ root, sourceDirectory: `${root}dist` });
console.log(`${worker.name} に公開する dist/ を .cloudflare/output/ に書きました`);
