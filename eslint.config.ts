import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint, { type CompatiblePlugin } from "typescript-eslint";
import { browserRule, importsRule, jsxRule } from "./guards/rules";
import { browserSinks, zones } from "./guards/zones";

const readAdr0003 = "docs/adr/0003-prefer-mechanical-guards.md を読んでください。";
const readAdr0007 = "docs/adr/0007-confine-browser-access.md を読んでください。";

const localPlugin = {
  meta: { name: "local" },
  rules: { browser: browserRule, jsx: jsxRule, imports: importsRule },
};
// typescript-eslint's plugin type accepts the rules that @typescript-eslint/utils creates.
const local: CompatiblePlugin = localPlugin;

const error = (...options: unknown[]): ["error", ...unknown[]] => ["error", ...options];

// Ways to make a type say something the value is not, besides any, as and !.
const typeLies = [
  "TSTypePredicate",
  "TSDeclareFunction",
  "MethodDefinition[value.type='TSEmptyBodyFunctionExpression']",
  "TSModuleDeclaration",
  ":matches(PropertyDefinition, AccessorProperty, VariableDeclarator)[definite=true]",
  "[declare=true]",
];

export default defineConfig([
  // guard-probes holds code that breaks the rules on purpose; guards/probes.test.ts lints it.
  // .cloudflare holds a copy of dist/ that scripts/cloudflare-output.ts writes for cf deploy.
  globalIgnores(["dist", ".cloudflare", "guard-probes"]),
  { linterOptions: { noInlineConfig: true } },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      parserOptions: { projectService: true, tsconfigRootDir: import.meta.dirname },
    },
    plugins: { local },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true },
      ],
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "@typescript-eslint/triple-slash-reference": [
        "error",
        { lib: "never", path: "never", types: "never" },
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: typeLies.slice(-2).join(", "),
          message: `\`text!: string\` のような \`!\` による決めつけと \`declare\` は、型と実際の値を食い違わせるため使えません。型の絞り込みで合わせてください。${readAdr0003}`,
        },
      ],
    },
  },
  ...Object.values(zones).map((zone) => ({
    files: [zone.dir, ...("probes" in zone ? [zone.probes] : [])].map(
      (dir) => `${dir}**/*.{ts,tsx}`,
    ),
    rules: {
      "local/browser": error({ allowed: zone.browser, sinks: browserSinks }),
      "local/jsx": error({
        tags: zone.tags,
        attributes: zone.attributes,
        dynamicAttributes: zone.dynamicAttributes,
      }),
      "local/imports": error({ imports: zone.imports, testImports: zone.testImports }),
      // The ways ECMAScript reaches the global object or runs a string as code.
      "no-restricted-globals": error(
        ...["globalThis", "eval", "Function", "Reflect"].map((name) => ({
          name,
          message: `${name} を通すと、ほかの守りを回り込めるため使えません。${readAdr0007}`,
        })),
      ),
      "no-restricted-syntax": error(
        ...[...typeLies, "ImportExpression"].map((selector) => ({
          selector,
          message: `ページのコードでは、型を偽る書き方と import() を使えません。${readAdr0007}`,
        })),
      ),
    },
  })),
]);
