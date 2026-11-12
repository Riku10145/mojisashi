import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const keepTextNowhere =
  "文章を外に送らないため、通信の仕組みは使えません。docs/adr/0001-keep-text-nowhere.md を読んでください。";

const networkGlobals = ["fetch", "XMLHttpRequest", "WebSocket", "EventSource"];
const globalObjects = ["window", "globalThis", "self"];

export default defineConfig([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.strictTypeChecked,
      reactHooks.configs.flat.recommended,
    ],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-non-null-assertion": "error",
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "no-restricted-globals": [
        "error",
        ...networkGlobals.map((name) => ({ name, message: keepTextNowhere })),
      ],
      "no-restricted-properties": [
        "error",
        { property: "sendBeacon", message: keepTextNowhere },
        ...globalObjects.flatMap((object) =>
          networkGlobals.map((property) => ({ object, property, message: keepTextNowhere })),
        ),
      ],
    },
  },
]);
