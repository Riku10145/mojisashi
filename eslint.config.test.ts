import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { ESLint } from "eslint";
import { expect, it } from "vitest";

const root = fileURLToPath(new URL(".", import.meta.url));

// Each file in guard-probes/blocked breaks a rule in CLAUDE.md. The ESLint rule named here must stop it.
const blocked: Record<string, string> = {
  "fetch.ts": "no-restricted-globals",
  "local-storage.ts": "no-restricted-globals",
  "script-element.tsx": "no-restricted-syntax",
  "non-null.ts": "@typescript-eslint/no-non-null-assertion",
  "open-self.ts": "no-restricted-properties",
  "open-window-window.ts": "no-restricted-properties",
  "open-default-view.ts": "no-restricted-properties",
  "open-top.ts": "no-restricted-properties",
  "open-parent.ts": "no-restricted-properties",
  "navigation-navigate.ts": "no-restricted-globals",
  "location-alias.ts": "no-restricted-properties",
  "location-object-assign.ts": "no-restricted-globals",
  "anchor-href.ts": "no-restricted-syntax",
  "anchor-object-assign.ts": "no-restricted-syntax",
  "anchor-set-attribute.ts": "no-restricted-properties",
  "jsx-href.tsx": "no-restricted-syntax",
  "opfs.ts": "no-restricted-properties",
  "history-replace-state.ts": "no-restricted-globals",
  "window-name.ts": "no-restricted-globals",
  "reflect-get.ts": "no-restricted-globals",
  "eval.ts": "no-restricted-globals",
  "preconnect.ts": "no-restricted-syntax",
  "prefetch-dns-namespace.ts": "no-restricted-properties",
  "meta-refresh.tsx": "no-restricted-syntax",
  "link-element.tsx": "no-restricted-syntax",
  "spread-style.tsx": "no-restricted-syntax",
  "spread-dangerously.tsx": "no-restricted-syntax",
  "create-element.ts": "no-restricted-syntax",
  "create-element-namespace.ts": "no-restricted-properties",
  "clone-element.tsx": "no-restricted-syntax",
  "jsx-runtime.ts": "no-restricted-syntax",
  "variable-tag.tsx": "no-restricted-syntax",
  "style-element.tsx": "no-restricted-syntax",
  "inner-html.ts": "no-restricted-properties",
  "document-write.ts": "no-restricted-properties",
  "dom-parser.ts": "no-restricted-globals",
  "definite-field.ts": "no-restricted-syntax",
  "definite-variable.ts": "no-restricted-syntax",
  "declare-variable.ts": "no-restricted-syntax",
  "ts-expect-error.ts": "@typescript-eslint/ban-ts-comment",
};

// Probes that the checks do not stop yet.
const notStoppedYet = new Set([
  "definite-field.ts",
  "definite-variable.ts",
  "declare-variable.ts",
  "ts-expect-error.ts",
]);

const results = await new ESLint({ cwd: root, ignore: false }).lintFiles(["guard-probes"]);
const messagesOf = (file: string) =>
  results.find((result) => result.filePath === `${root}guard-probes/${file}`)?.messages;

it("guard-probes/blocked のファイルが、すべて表にある", async () => {
  const files = await readdir(new URL("guard-probes/blocked/", import.meta.url));
  expect(files.toSorted()).toEqual(Object.keys(blocked).toSorted());
});

for (const [file, rule] of Object.entries(blocked)) {
  (notStoppedYet.has(file) ? it.fails : it)(`${file} を ${rule} が止める`, () => {
    expect(messagesOf(`blocked/${file}`)?.map((message) => message.ruleId)).toContain(rule);
  });
}

for (const file of await readdir(new URL("guard-probes/allowed/", import.meta.url))) {
  it(`${file} は止めない`, () => {
    expect(messagesOf(`allowed/${file}`)).toEqual([]);
  });
}
