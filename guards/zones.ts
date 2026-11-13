// The zones of src/ and everything each may use (ADR 0007). Every list is an allowlist: a name,
// tag or package that is not here is refused, including browser APIs that do not exist yet.
// eslint.config.ts, guards/probes.test.ts and guards/files.test.ts read this file.

export type Zone = {
  /** The folder the zone owns. */
  dir: string;
  /** The tsconfig that compiles the zone. */
  tsconfig: string;
  /** Folder of blocked and allowed probes, linted and type-checked as if they lived in the zone. */
  probes?: string;
  /** Members and globals of lib.dom the zone may use, as Interface.member or a global's name. */
  browser: readonly string[];
  /** Packages the zone may import values from, with the names it may import. Types are free. */
  imports: Readonly<Record<string, readonly string[]>>;
  /** Extra imports for *.test.ts files. */
  testImports: Readonly<Record<string, readonly string[]>>;
  /** Lower-case JSX elements the zone may render. */
  tags: readonly string[];
  /** Attributes the zone may write on those elements. */
  attributes: readonly string[];
  /** Of those, the ones whose value may be an expression rather than a literal. */
  dynamicAttributes: readonly string[];
};

const vitest = { vitest: ["describe", "expect", "it", "test"] };

export const zones = {
  // Feature code. Compiled without lib.dom, so it cannot name, receive or reach a browser object.
  app: {
    dir: "src/app/",
    tsconfig: "tsconfig.app.json",
    probes: "guard-probes/app/",
    browser: [],
    imports: {
      react: [
        "Fragment",
        "useCallback",
        "useDeferredValue",
        "useEffect",
        "useId",
        "useMemo",
        "useReducer",
        "useState",
        "useTransition",
      ],
    },
    testImports: vitest,
    tags: "main section header footer h1 h2 h3 p span div ul ol li dl dt dd strong em small output br a".split(
      " ",
    ),
    attributes:
      "className id key role lang hidden title href children aria-live aria-label aria-describedby aria-hidden".split(
        " ",
      ),
    dynamicAttributes: ["className", "key", "children", "hidden", "aria-label"],
  },
  // The one door to the browser for features. Its exports take and give strings, numbers,
  // Uint8Array and components only.
  platform: {
    dir: "src/platform/",
    tsconfig: "tsconfig.platform.json",
    probes: "guard-probes/platform/",
    browser: [
      "HTMLTextAreaElement.value",
      "HTMLInputElement.value",
      "crypto",
      "Crypto.getRandomValues",
      "navigator",
      "Navigator.clipboard",
      "Clipboard.writeText",
    ],
    imports: { react: ["useId", "useState"] },
    testImports: { ...vitest, "react-dom/server": ["renderToString"] },
    tags: ["div", "p", "label", "textarea", "input", "fieldset", "legend", "button"],
    attributes:
      "className id key htmlFor rows value type inputMode name checked disabled role spellCheck autoComplete onChange onClick children".split(
        " ",
      ),
    dynamicAttributes:
      "id key htmlFor rows value name checked disabled onChange onClick children".split(" "),
  },
  // Boot: renders the app into #root, and to HTML at build time.
  shell: {
    dir: "src/shell/",
    tsconfig: "tsconfig.shell.json",
    browser: [
      "document",
      "Document.getElementById",
      "Node",
      "Node.childNodes",
      "Node.nodeType",
      "Node.textContent",
      "Node.TEXT_NODE",
      "Node.COMMENT_NODE",
    ],
    imports: {
      react: ["StrictMode"],
      "react-dom/client": ["createRoot", "hydrateRoot"],
      "react-dom/server": ["renderToString"],
    },
    testImports: vitest,
    tags: [],
    attributes: [],
    dynamicAttributes: [],
  },
} as const satisfies Record<string, Zone>;

/** Functions outside lib.dom that may receive a browser value: React mounts into #root. */
export const browserSinks = ["createRoot", "hydrateRoot"];
