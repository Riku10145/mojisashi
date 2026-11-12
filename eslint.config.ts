import js from "@eslint/js";
import reactHooks from "eslint-plugin-react-hooks";
import { defineConfig, globalIgnores } from "eslint/config";
import globals from "globals";
import tseslint from "typescript-eslint";

const readAdr0001 = "docs/adr/0001-keep-text-nowhere.md を読んでください。";
const readAdr0003 = "docs/adr/0003-prefer-mechanical-guards.md を読んでください。";

const anyOf = (names: string[], flags = "") => `/^(${names.join("|")})$/${flags}`;

// Navigation attributes, which CSP cannot stop. src, action and formAction are left to CSP.
const navigationUrl = anyOf(["href", "xlinkHref"]);

// React hoists <link>, <meta> and <style> into the head, and <meta http-equiv="refresh"> navigates.
// One string, because each tag name on its own is a string literal the guards below ban.
const bannedTags = "script style link meta base iframe frame object embed portal".split(" ");

type Guard = {
  message: string;
  // Banned as a global, as a property of any object and as an imported name, so chains such as
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
    names: [
      "localStorage",
      "sessionStorage",
      "indexedDB",
      "caches",
      "cookieStore",
      "cookie",
      "storage",
      "history",
    ],
  },
  {
    message: `Reflect と eval は名前を文字列で受け取るので、ほかの守りを回り込めます。そのため使えません。${readAdr0001}`,
    globals: ["Reflect", "eval"],
  },
  {
    message: `ページの移動やワーカーは、文章を外に運んだり残したりできるため使えません。${readAdr0001}`,
    names: [
      "Worker",
      "SharedWorker",
      "BroadcastChannel",
      "serviceWorker",
      "open",
      "location",
      "navigation",
      "setAttribute",
      "setAttributeNS",
    ],
    selectors: [
      `AssignmentExpression > MemberExpression.left:matches([property.name=${navigationUrl}], [property.value=${navigationUrl}])`,
      `Property:matches([key.name=${navigationUrl}], [key.value=${navigationUrl}])`,
      `JSXAttribute[name.name=${navigationUrl}][value.type!='Literal']`,
    ],
  },
  {
    message: `window や別のウィンドウを取り出すと、ほかの守りを回り込んで文章を外に運べるため使えません。${readAdr0001}`,
    names: ["defaultView", "contentWindow", "opener", "postMessage"],
    globals: ["window", "self", "globalThis", "top", "parent", "frames"],
  },
  {
    message: `preconnect などのリソースヒントは、ホスト名に入れた文章を CSP（connect-src 'self'）を越えて届けるため使えません。${readAdr0001}`,
    names: ["preconnect", "prefetchDNS", "preload", "preloadModule", "preinit", "preinitModule"],
  },
  {
    message: `CSP（style-src 'self'）がインラインの style を止めるため、Tailwind のクラスで書いてください。${readAdr0003}`,
    selectors: ["JSXAttribute[name.name='style']"],
  },
  {
    message: `<script>、<style>、<link>、<meta> などの要素と dangerouslySetInnerHTML は使えません。CSP が止めるスクリプトやスタイル、CSP では止まらないページの移動や先読み、確かめていない HTML をページに入れる入り口になるためです。${readAdr0003}`,
    selectors: [
      `JSXOpeningElement[name.name=${anyOf(bannedTags)}]`,
      "JSXAttribute[name.name='dangerouslySetInnerHTML']",
    ],
  },
  {
    message: `JSX のスプレッド、createElement、innerHTML のように、属性や要素の名前や HTML を JSX の外から渡す仕組みは使えません。インラインの style、<script>、確かめていない HTML を、守りに気づかれずにページに入れられるためです。${readAdr0003}`,
    names: [
      "createElement",
      "cloneElement",
      "jsx",
      "jsxs",
      "jsxDEV",
      "innerHTML",
      "outerHTML",
      "insertAdjacentHTML",
      "srcdoc",
      "write",
      "writeln",
      "createContextualFragment",
      "setHTMLUnsafe",
      "parseHTMLUnsafe",
      "DOMParser",
      "parseFromString",
    ],
    selectors: [
      "JSXSpreadAttribute",
      // const Script = "script"; <Script /> renders a <script>. Comparisons such as
      // typeof value === "object" cannot become a tag, so they stay allowed.
      `:not(JSXAttribute, BinaryExpression, SwitchCase) > Literal[value=${anyOf(bannedTags, "i")}]`,
      `TemplateElement[value.cooked=${anyOf(bannedTags, "i")}]`,
    ],
  },
  {
    message: `\`text!: string\` のような \`!\` による決めつけと \`declare\` は、型と実際の値を食い違わせるため使えません。型の絞り込みで合わせてください。${readAdr0003}`,
    selectors: [
      ":matches(PropertyDefinition, AccessorProperty, VariableDeclarator)[definite=true]",
      ":matches(VariableDeclaration, PropertyDefinition, AccessorProperty, ClassDeclaration, TSDeclareFunction, TSEnumDeclaration, TSModuleDeclaration)[declare=true]",
    ],
  },
];

export default defineConfig([
  // guard-probes holds code that breaks the rules on purpose; eslint.config.test.ts lints it.
  globalIgnores(["dist", "guard-probes"]),
  { linterOptions: { noInlineConfig: true } },
  {
    files: ["**/*.{js,jsx,mjs,cjs}"],
    languageOptions: { parserOptions: { ecmaFeatures: { jsx: true } } },
    rules: {
      "no-restricted-syntax": [
        "error",
        {
          selector: "Program",
          message: `JavaScript のファイルは書けません。型のチェックと ESLint の守りが届かないためです。TypeScript で書いてください。${readAdr0003}`,
        },
      ],
    },
  },
  {
    files: ["**/*.{ts,tsx,mts,cts}"],
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
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true },
      ],
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
        ...guards.flatMap(({ message, names = [], selectors = [] }) =>
          [
            ...(names.length > 0
              ? [
                  `:matches(ImportSpecifier[imported.name=${anyOf(names)}], ImportSpecifier[imported.value=${anyOf(names)}], ExportSpecifier[local.name=${anyOf(names)}])`,
                ]
              : []),
            ...selectors,
          ].map((selector) => ({ selector, message })),
        ),
      ],
    },
  },
]);
