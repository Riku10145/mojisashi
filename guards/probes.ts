import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import ts from "typescript";
import { zones } from "./zones";

const root = fileURLToPath(new URL("../", import.meta.url));

export type Probe = {
  file: string;
  kind: "blocked" | "allowed";
  /** What a blocked probe names on its first line, as `// stopped-by: TS2304` or a rule id. */
  stoppedBy: string | undefined;
  typeErrors: string[];
  ruleIds: string[];
};

/**
 * Type-checks each probe in its own program. In one shared program, a probe's
 * /// <reference lib="dom" /> or declare global would give every other probe the browser too.
 */
function typeErrorsOf(tsconfig: string, files: string[]): Map<string, string[]> {
  const config = ts.getParsedCommandLineOfConfigFile(
    tsconfig,
    {},
    {
      ...ts.sys,
      onUnRecoverableConfigFileDiagnostic: (diagnostic) => {
        throw new Error(ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"));
      },
    },
  );
  if (config === undefined) {
    throw new Error(`${tsconfig} が読めません`);
  }
  const host = ts.createCompilerHost(config.options);
  // Files outside the probes are the same for every program, so parse them once.
  const shared = new Map<string, ts.SourceFile | undefined>();
  const getSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreate) => {
    if (fileName.includes("/guard-probes/")) {
      return getSourceFile(fileName, languageVersion, onError, shouldCreate);
    }
    if (!shared.has(fileName)) {
      shared.set(fileName, getSourceFile(fileName, languageVersion, onError, shouldCreate));
    }
    return shared.get(fileName);
  };
  return new Map(
    files.map((file) => {
      const program = ts.createProgram({
        rootNames: [file],
        options: config.options,
        projectReferences: config.projectReferences ?? [],
        host,
      });
      const errors = ts
        .getPreEmitDiagnostics(program)
        .filter((diagnostic) => diagnostic.file?.fileName === file)
        .map((diagnostic) => `TS${String(diagnostic.code)}`);
      return [file, errors];
    }),
  );
}

/** Every probe of every zone, with what tsc and ESLint said about it. */
export async function probes(): Promise<Probe[]> {
  const found: { file: string; kind: "blocked" | "allowed"; tsconfig: string }[] = [];
  for (const zone of Object.values(zones)) {
    if (!("probes" in zone)) {
      continue;
    }
    for (const kind of ["blocked", "allowed"] as const) {
      for (const name of (await readdir(`${root}${zone.probes}${kind}/`)).toSorted()) {
        found.push({
          file: `${root}${zone.probes}${kind}/${name}`,
          kind,
          tsconfig: `${root}${zone.probes}tsconfig.json`,
        });
      }
    }
  }
  const typeErrors = new Map<string, string[]>();
  for (const tsconfig of new Set(found.map((probe) => probe.tsconfig))) {
    const files = found.filter((probe) => probe.tsconfig === tsconfig).map((probe) => probe.file);
    for (const [file, errors] of typeErrorsOf(tsconfig, files)) {
      typeErrors.set(file, errors);
    }
  }
  const results = await new ESLint({ cwd: root, ignore: false }).lintFiles(
    found.map((probe) => probe.file),
  );
  return Promise.all(
    found.map(async ({ file, kind }) => ({
      file: file.slice(root.length),
      kind,
      stoppedBy: /^\/\/ stopped-by: (\S+)/.exec(await readFile(file, "utf8"))?.[1],
      typeErrors: typeErrors.get(file) ?? [],
      ruleIds: (results.find((result) => result.filePath === file)?.messages ?? []).map(
        (message) => message.ruleId ?? "fatal",
      ),
    })),
  );
}
