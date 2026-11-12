import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const readAdr0001 = "docs/adr/0001-keep-text-nowhere.md を読んでください。";
const readAdr0003 = "docs/adr/0003-prefer-mechanical-guards.md を読んでください。";

const locationObject = ":matches([object.name='location'], [object.property.name='location'])";

type Guard = {
  message: string;
  // Banned as a global and as a property of any object, so chains such as
  // window.window.fetch, iframe.contentWindow?.fetch and w["fetch"] are caught too.
  names?: string[];
  // Banned only as a global, because the same property name is legitimate elsewhere.
  globals?: string[];
  selectors?: string[];
};

const guards: Guard[] = [
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
  {
    message: `ページの移動やワーカーは、文章を外に運んだり残したりできるため使えません。${readAdr0001}`,
    names: ["Worker", "SharedWorker", "BroadcastChannel", "serviceWorker"],
    globals: ["open"],
    selectors: [
      "MemberExpression[object.name=/^(window|globalThis)$/]:matches([computed=false][property.name='open'], [property.value='open'])",
      "AssignmentExpression > Identifier.left[name='location']",
      "AssignmentExpression > MemberExpression.left:matches([computed=false][property.name='location'], [property.value='location'])",
      `AssignmentExpression > MemberExpression.left${locationObject}`,
      `CallExpression > MemberExpression.callee${locationObject}:matches([property.name=/^(assign|replace)$/], [property.value=/^(assign|replace)$/])`,
    ],
  },
  {
    message: `CSP（style-src 'self'）がインラインの style を止めるため、Tailwind のクラスで書いてください。${readAdr0003}`,
    selectors: ["JSXAttribute[name.name='style']"],
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
        ...guards.flatMap(({ message, names = [], globals = [] }) =>
          [...names, ...globals].map((name) => ({ name, message })),
        ),
      ],
      "no-restricted-properties": [
        "error",
        ...guards.flatMap(({ message, names = [] }) =>
          names.map((property) => ({ property, message })),
        ),
      ],
      "no-restricted-syntax": [
        "error",
        ...guards.flatMap(({ message, selectors = [] }) =>
          selectors.map((selector) => ({ selector, message })),
        ),
      ],
    },
  },
]);
