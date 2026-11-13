import { describe, expect, it } from "vitest";
import { probes } from "./probes";

const all = await probes();

describe("blocked の probe は、1行目の stopped-by に書いたもので止まる", () => {
  it.each(all.filter((probe) => probe.kind === "blocked").map((probe) => [probe.file, probe]))(
    "%s",
    (_, probe) => {
      expect(probe.stoppedBy).toBeDefined();
      expect([...probe.typeErrors, ...probe.ruleIds]).toContain(probe.stoppedBy);
    },
  );
});

describe("allowed の probe は、型チェックも ESLint も通る", () => {
  it.each(all.filter((probe) => probe.kind === "allowed").map((probe) => [probe.file, probe]))(
    "%s",
    (_, probe) => {
      expect([...probe.typeErrors, ...probe.ruleIds]).toEqual([]);
    },
  );
});
