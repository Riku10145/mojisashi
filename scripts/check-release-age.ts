import { minimumReleaseAgeOf, pinsOf, publishedAtOf, publishedWithin } from "./release-age";

const root = new URL("../", import.meta.url);
const seconds = minimumReleaseAgeOf(
  Bun.TOML.parse(await Bun.file(new URL("bunfig.toml", root)).text()),
);
const pins = pinsOf(Bun.JSONC.parse(await Bun.file(new URL("bun.lock", root)).text()));

async function publishTimes(name: string): Promise<unknown> {
  const view = Bun.spawn([process.execPath, "pm", "view", name, "time", "--json"], {
    stdout: "pipe",
    stderr: "inherit",
  });
  const [output, code] = await Promise.all([new Response(view.stdout).text(), view.exited]);
  if (code !== 0) {
    throw new Error(`bun pm view ${name} time が終了コード ${String(code)} で止まりました`);
  }
  return JSON.parse(output);
}

const times = new Map<string, unknown>();
const names = [...new Set(pins.map((pin) => pin.name))];
for (let start = 0; start < names.length; start += 16) {
  const batch = names.slice(start, start + 16);
  const results = await Promise.all(batch.map(publishTimes));
  batch.forEach((name, index) => times.set(name, results[index]));
}

const young = publishedWithin(
  pins.map((pin) => ({ ...pin, publishedAt: publishedAtOf(times.get(pin.name), pin.version) })),
  new Date(),
  seconds,
);
if (young.length > 0) {
  console.error(`bun.lock に、公開から ${String(seconds)} 秒たっていない版があります:`);
  for (const pin of young) {
    console.error(`  ${pin.name}@${pin.version}（${pin.publishedAt.toISOString()} に公開）`);
  }
  process.exit(1);
}
console.log(
  `bun.lock の ${String(pins.length)} 個の版は、すべて公開から ${String(seconds)} 秒以上たっています`,
);
