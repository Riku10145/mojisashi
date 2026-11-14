// Checks over the files that configure the guards. Each returns the problems it found; an empty list
// means the file is allowed. They are allowlists or floors, so tightening never needs an edit here.

const readAdr0007 = "docs/adr/0007-confine-browser-access.md を読んでください。";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

// ---- CSP: public/_headers may be stricter than this, never looser. --------------------------------

/** Each directive with every source it may hold. A directive not listed here may not appear. */
export const cspFloor: ReadonlyMap<string, readonly string[]> = new Map([
  ["default-src", ["'none'"]],
  ["script-src", ["'self'"]],
  ["style-src", ["'self'"]],
  // The page shows no image and loads no font. CSS that picks an image per bit of the 文章 would
  // otherwise send it to our own server, one request per bit.
  ["img-src", ["'none'"]],
  ["font-src", ["'none'"]],
  ["connect-src", ["'none'"]],
  ["object-src", ["'none'"]],
  ["base-uri", ["'none'"]],
  ["form-action", ["'none'"]],
  ["frame-ancestors", ["'none'"]],
  // Trusted Types: innerHTML, document.write and script.src refuse plain strings.
  ["require-trusted-types-for", ["'script'"]],
  ["trusted-types", ["'none'"]],
]);

function policyProblems(policy: string): string[] {
  const directives = new Map<string, string[]>();
  for (const part of policy.split(";")) {
    const [name = "", ...sources] = part.trim().split(/\s+/);
    if (name !== "") {
      directives.set(name.toLowerCase(), sources);
    }
  }
  const problems: string[] = [];
  // Leaving a directive out falls back to default-src or to no limit at all.
  for (const name of cspFloor.keys()) {
    if (!directives.has(name)) {
      problems.push(`CSP に ${name} がありません`);
    }
  }
  for (const [name, sources] of directives) {
    const allowed = cspFloor.get(name);
    if (allowed === undefined) {
      problems.push(`CSP の ${name} は決めた指定にありません`);
      continue;
    }
    for (const source of sources) {
      // 'none' alone is the strictest value any source list can take.
      if (!allowed.includes(source) && !(source === "'none'" && sources.length === 1)) {
        problems.push(`CSP の ${name} に ${source} は入れられません`);
      }
    }
  }
  return problems;
}

/** Problems with a Cloudflare _headers file: every page needs a CSP no looser than cspFloor. */
export function headersProblems(file: string): string[] {
  const problems: string[] = [];
  let path: string | undefined;
  let coversEveryPage = false;
  for (const line of file.split("\n")) {
    if (line.trim() === "" || line.trim().startsWith("#")) {
      continue;
    }
    if (!/^\s/.test(line)) {
      path = line.trim();
      continue;
    }
    const header = /^\s+(!\s*)?([\w-]+)\s*:?\s*(.*)$/.exec(line);
    if (header?.[1] !== undefined) {
      // Cloudflare removes a header for the path with "! Name".
      problems.push(`_headers の ${line.trim()} でヘッダーを外せません。${readAdr0007}`);
    } else if (header?.[2]?.toLowerCase() === "content-security-policy") {
      problems.push(
        ...policyProblems(header[3] ?? "").map((problem) => `${problem}。${readAdr0007}`),
      );
      coversEveryPage ||= path === "/*";
    }
  }
  if (!coversEveryPage) {
    problems.push(`_headers に、/* の Content-Security-Policy がありません。${readAdr0007}`);
  }
  return problems;
}

// ---- bunfig.toml: the wait never shrinks, and nothing else changes how packages are installed. -----

export const minimumReleaseAgeFloor = 604_800;

/** Reads the small TOML subset bunfig.toml uses: [table] lines and key = number lines. */
export function bunfigProblems(file: string): string[] {
  const problems: string[] = [];
  let table = "";
  let age: number | undefined;
  for (const line of file.split("\n").map((raw) => raw.replace(/#.*$/, "").trim())) {
    const tableName = /^\[([\w.]+)\]$/.exec(line)?.[1];
    const entry = /^(\w+)\s*=\s*(\d+)$/.exec(line);
    if (line === "") {
      continue;
    } else if (tableName === "install") {
      table = tableName;
    } else if (table === "install" && entry?.[1] === "minimumReleaseAge") {
      age = Number(entry[2]);
    } else {
      problems.push(`bunfig.toml の「${line}」は使えません。${readAdr0007}`);
    }
  }
  if (age === undefined || age < minimumReleaseAgeFloor) {
    problems.push(
      `bunfig.toml の minimumReleaseAge は ${String(minimumReleaseAgeFloor)} 以上にします。${readAdr0007}`,
    );
  }
  return problems;
}

// ---- Commands: package.json scripts, lefthook and workflows run only these programs. ---------------

// A command not listed fails, so bunx, bun x, npx, ; and | need no names of their own.
const programs: readonly RegExp[] = [
  /^vite( build| preview)?$/,
  /^tsc -b$/,
  // ESLint and Vitest prefer a .js config they find to the guarded one, so the command names it.
  /^eslint --config eslint\.config\.ts --max-warnings 0 \.$/,
  /^oxfmt( --check)?$/,
  /^vitest run --config vite\.config\.ts$/,
  /^lefthook install$/,
  /^(NODE_ENV=production )?bun scripts\/[a-z-]+\.ts$/,
  /^bun install --frozen-lockfile$/,
  // Deploys an environment of cloudflare.config.ts from dist/ without building (ADR 0009).
  /^bun scripts\/cloudflare-output\.ts [a-z]+$/,
  /^cf deploy --prebuilt --mode [a-z]+$/,
  // The Guards workflow: fetch the pull request without checking it out, then compare.
  /^git fetch --no-tags origin "pull\/\$\{\{ github\.event\.pull_request\.number \}\}\/head:pr-head"$/,
  /^bash \.github\/guards-unchanged\.sh "\$\{\{ github\.event\.pull_request\.base\.sha \}\}" pr-head$/,
];

/** Each &&-separated part must be a listed program, or bun run with a script in package.json. */
export function commandProblems(
  where: string,
  command: string,
  scripts: readonly string[],
): string[] {
  return command
    .split("&&")
    .map((part) => part.trim())
    .filter((part) => {
      const script = /^bun run ([\w:-]+)$/.exec(part)?.[1];
      return script === undefined
        ? !programs.some((program) => program.test(part))
        : !scripts.includes(script);
    })
    .map((part) => `${where} の「${part}」は、決めたコマンドではありません。${readAdr0007}`);
}

const dependencyRange = /^[~^]?\d+\.\d+\.\d+$/;
// cf is in beta, so its prerelease is pinned exactly (ADR 0006). Every other package stays on a
// release; .github/guards-unchanged.sh makes the same exception.
const prereleaseDependencies = ["cf"];
const pinnedPrerelease = /^\d+\.\d+\.\d+-[0-9A-Za-z.-]+$/;
const packageKeys = ["name", "private", "type", "scripts", "dependencies", "devDependencies"];

/** package.json: known fields, plain semver ranges from the registry, and allowed commands. */
export function packageProblems(pkg: unknown): string[] {
  if (!isRecord(pkg)) {
    return ["package.json が読めません"];
  }
  const problems = Object.keys(pkg)
    .filter((key) => !packageKeys.includes(key))
    .map((key) => `package.json の ${key} は使えません。${readAdr0007}`);
  for (const field of ["dependencies", "devDependencies"]) {
    const dependencies = pkg[field];
    for (const [name, range] of Object.entries(isRecord(dependencies) ? dependencies : {})) {
      const allowed =
        typeof range === "string" &&
        (dependencyRange.test(range) ||
          (prereleaseDependencies.includes(name) && pinnedPrerelease.test(range)));
      if (!allowed) {
        problems.push(`package.json の ${name} は npm の版の範囲で書きます。${readAdr0007}`);
      }
    }
  }
  const scripts = isRecord(pkg["scripts"]) ? pkg["scripts"] : {};
  for (const [name, command] of Object.entries(scripts)) {
    problems.push(
      ...(typeof command === "string"
        ? commandProblems(`package.json の ${name}`, command, Object.keys(scripts))
        : [`package.json の ${name} が読めません`]),
    );
  }
  return problems;
}

// Actions pinned to a commit. Another action runs code that release age and bun.lock never see.
const actions = [
  "actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1",
  "oven-sh/setup-bun@0c5077e51419868618aeaa5fe8019c62421857d6",
  "actions/setup-node@949feb2413d6458794dcd2491c4babbbce0c15c1",
];

// Keys that change what interprets run:, where it runs, or whether a failure counts.
const workflowControlKeys = [
  "shell",
  "if",
  "continue-on-error",
  "env",
  "working-directory",
  "defaults",
];
// An env: block may hold these lines only, each exactly: the Cloudflare account cf deploys to, and
// cf's telemetry turned off. Any other variable, such as NODE_OPTIONS or BUN_CONFIG_*, changes how a
// command runs.
const workflowEnv = [
  "CLOUDFLARE_API_TOKEN: ${{ secrets.CLOUDFLARE_API_TOKEN }}",
  "CLOUDFLARE_ACCOUNT_ID: ${{ vars.CLOUDFLARE_ACCOUNT_ID }}",
  'DO_NOT_TRACK: "1"',
];
const lefthookKeys = ["assert_lefthook_installed", "pre-commit", "commands", "check", "run"];

function yamlEntriesOf(yaml: string): { key: string; value: string }[] {
  return yaml
    .split("\n")
    .map((line) => /^\s*(?:-\s+)?([\w-]+):\s*(.*?)\s*(?:#.*)?$/.exec(line))
    .filter((match) => match !== null)
    .map(([, key = "", value = ""]) => ({ key, value }));
}

function runProblems(where: string, value: string, scripts: readonly string[]): string[] {
  return /^[|>]/.test(value)
    ? [`${where} の複数行の run は使えません。${readAdr0007}`]
    : commandProblems(where, value, scripts);
}

/** Each line inside an env: block that is not in workflowEnv, and the lines outside every block. */
function splitEnvBlocks(where: string, yaml: string): { problems: string[]; outside: string } {
  const problems: string[] = [];
  const outside: string[] = [];
  let envColumn: number | undefined;
  for (const line of yaml.split("\n")) {
    const content = line.trim();
    const skipped = content === "" || content.startsWith("#");
    if (envColumn !== undefined && (skipped || line.search(/\S/) > envColumn)) {
      if (!skipped && !workflowEnv.includes(content)) {
        problems.push(`${where} の env の「${content}」は使えません。${readAdr0007}`);
      }
      continue;
    }
    envColumn = /^\s*(?:-\s+)?(?=env:\s*(?:#.*)?$)/.exec(line)?.[0].length;
    if (envColumn === undefined) {
      outside.push(line);
    }
  }
  return { problems, outside: outside.join("\n") };
}

/**
 * A workflow: every run: line is an allowed command, every uses: a pinned action, and every line of
 * an env: block one of workflowEnv.
 */
export function workflowProblems(
  where: string,
  yaml: string,
  scripts: readonly string[],
): string[] {
  const { problems, outside } = splitEnvBlocks(where, yaml);
  return [
    ...problems,
    ...yamlEntriesOf(outside).flatMap(({ key, value }) => {
      if (key === "run") {
        return runProblems(where, value, scripts);
      }
      if (key === "uses" && !actions.includes(value)) {
        return [`${where} の ${value} は、決めたアクションではありません。${readAdr0007}`];
      }
      return workflowControlKeys.includes(key)
        ? [`${where} の ${key}: は使えません。${readAdr0007}`]
        : [];
    }),
  ];
}

/** lefthook.yml: only the pre-commit check, which must not run when lefthook is missing. */
export function lefthookProblems(yaml: string, scripts: readonly string[]): string[] {
  const entries = yamlEntriesOf(yaml);
  const problems = entries.flatMap(({ key, value }) => {
    if (key === "run") {
      return runProblems("lefthook.yml", value, scripts);
    }
    return lefthookKeys.includes(key)
      ? []
      : [`lefthook.yml の ${key}: は使えません。${readAdr0007}`];
  });
  if (!entries.some(({ key, value }) => key === "assert_lefthook_installed" && value === "true")) {
    problems.push(`lefthook.yml には assert_lefthook_installed: true がいります。${readAdr0007}`);
  }
  return problems;
}
