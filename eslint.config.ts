import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const readAdr0001 = "docs/adr/0001-keep-text-nowhere.md を読んでください。";

// Each name is banned as a global and as a property of any object, so chains such as
// window.window.fetch, iframe.contentWindow?.fetch and w["fetch"] are caught too.
const guards = [
  {
    message: `文章を外に送らないため、通信の仕組みは使えません。${readAdr0001}`,
    names: [
      "fetch",
      "XMLHttpRequest",
      "WebSocket",
      "EventSource",
      "WebTransport",
      "RTCPeerConnection",
      "RTCDataChannel",
      "sendBeacon",
    ],
  },
  {
    message: `文章をブラウザの中にも残さないため、保存の仕組みは使えません。${readAdr0001}`,
    names: ["localStorage", "sessionStorage", "indexedDB", "caches", "cookieStore", "cookie"],
  },
];

export default defineConfig([
  globalIgnores(["dist"]),
  { linterOptions: { noInlineConfig: true } },
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
        ...guards.flatMap(({ message, names }) => names.map((name) => ({ name, message }))),
      ],
      "no-restricted-syntax": [
        "error",
        {
          selector: "JSXAttribute[name.name='style']",
          message:
            "CSP（style-src 'self'）がインラインの style を止めるため、Tailwind のクラスで書いてください。docs/adr/0003-prefer-mechanical-guards.md を読んでください。",
        },
      ],
      "no-restricted-properties": [
        "error",
        ...guards.flatMap(({ message, names }) => names.map((property) => ({ property, message }))),
      ],
    },
  },
]);
