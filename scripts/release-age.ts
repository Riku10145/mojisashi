export type Pin = { name: string; version: string };
export type PublishedPin = Pin & { publishedAt: Date };

const semver = /^\d+\.\d+\.\d+(?:[-+][0-9A-Za-z.+-]*)?$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

export function minimumReleaseAgeOf(bunfig: unknown): number {
  const install = isRecord(bunfig) ? bunfig["install"] : undefined;
  const seconds = isRecord(install) ? install["minimumReleaseAge"] : undefined;
  if (typeof seconds !== "number") {
    throw new Error("bunfig.toml に [install] の minimumReleaseAge がありません");
  }
  return seconds;
}

export function pinsOf(lock: unknown): Pin[] {
  const packages = isRecord(lock) ? lock["packages"] : undefined;
  if (!isRecord(packages)) {
    throw new Error("bun.lock に packages がありません");
  }
  const pins = new Map<string, Pin>();
  for (const entry of Object.values(packages)) {
    const id: unknown = Array.isArray(entry) ? entry[0] : undefined;
    const resolved: unknown = Array.isArray(entry) ? entry[1] : undefined;
    if (typeof id !== "string") {
      throw new Error(`bun.lock の packages に読めない項目があります: ${JSON.stringify(entry)}`);
    }
    // bun installs from entry[1] when it is set, so a tarball URL there can install a version
    // that id does not name. "" means the default registry, by id's name and version.
    if (resolved !== "") {
      throw new Error(
        `${id} は npm のレジストリ以外（${JSON.stringify(resolved)}）から入るので、公開日を確かめられません`,
      );
    }
    const at = id.lastIndexOf("@");
    const version = id.slice(at + 1);
    if (at <= 0 || !semver.test(version)) {
      throw new Error(`${id} は npm の版ではないので、公開日を確かめられません`);
    }
    pins.set(id, { name: id.slice(0, at), version });
  }
  return [...pins.values()];
}

// times is the output of `bun pm view <name> time --json`: each version mapped to its publish time.
export function publishedAtOf(times: unknown, version: string): Date {
  const time = isRecord(times) ? times[version] : undefined;
  if (typeof time !== "string") {
    throw new Error(`${version} の公開日がありません`);
  }
  return new Date(time);
}

export function publishedWithin(pins: PublishedPin[], now: Date, seconds: number): PublishedPin[] {
  return pins.filter((pin) => now.getTime() - pin.publishedAt.getTime() < seconds * 1000);
}
