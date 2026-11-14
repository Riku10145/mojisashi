// ESLint rules that enforce the allowlists in guards/zones.ts (ADR 0007).
import { AST_NODE_TYPES as T, ESLintUtils, type TSESTree } from "@typescript-eslint/utils";
import ts from "typescript";

const readAdr0007 = "docs/adr/0007-confine-browser-access.md を読んでください。";
const fixNotAdd =
  "コードを直してください。このエラーを消すために guards/zones.ts へ足すことはしません。機能に要ると決めたときだけ足します（docs/adr/0012-loosen-guards-only-on-purpose.md）。";
const createRule = ESLintUtils.RuleCreator.withoutDocs;

const stringList = { type: "array", items: { type: "string" } } as const;

// ---- local/browser --------------------------------------------------------------------------------

function isBrowserDeclaration(program: ts.Program, declaration: ts.Declaration): boolean {
  const file = declaration.getSourceFile();
  return program.isSourceFileDefaultLibrary(file) && /\/lib\.dom[.\w]*\.d\.ts$/.test(file.fileName);
}

/** "document" for a global, "Interface.member" for a member, as zones.ts writes them. */
function keyOf(declaration: ts.Declaration): string | undefined {
  const name = ts.getNameOfDeclaration(declaration)?.getText();
  const parent = declaration.parent;
  if (name === undefined) {
    return undefined;
  }
  if (ts.isSourceFile(parent) || ts.isVariableDeclarationList(parent)) {
    return name;
  }
  if (ts.isInterfaceDeclaration(parent)) {
    return `${parent.name.text}.${name}`;
  }
  // declare var Node: { readonly TEXT_NODE: 3; ... }
  if (ts.isTypeLiteralNode(parent) && ts.isVariableDeclaration(parent.parent)) {
    return `${parent.parent.name.getText()}.${name}`;
  }
  return undefined;
}

/**
 * Every lib.dom name the code reaches must be on the zone's list, and every expression whose type
 * comes from lib.dom must sit where it can only be read, compared or called. Anywhere else
 * (Object.assign, a variable typed { cookie: string }, a spread, a return value) is reported, so a
 * browser object cannot reach a member through a type that hides where it came from.
 */
export const browserRule = createRule<
  [{ allowed: string[]; sinks: string[] }],
  "notAllowed" | "escapes"
>({
  meta: {
    type: "problem",
    messages: {
      notAllowed: `{{key}} は、このゾーンで使えるブラウザの仕組みにありません。${fixNotAdd}${readAdr0007}`,
      escapes: `ブラウザの値（{{type}}）を、この形では使えません。メンバーを読むか、比べるか、呼ぶだけにします。${readAdr0007}`,
    },
    schema: [
      {
        type: "object",
        properties: { allowed: stringList, sinks: stringList },
        required: ["allowed", "sinks"],
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ allowed: [], sinks: [] }],
  },
  create(context, [{ allowed, sinks }]) {
    const services = ESLintUtils.getParserServices(context);
    const program = services.program;
    const checker = program.getTypeChecker();

    // A browser type is one lib.dom declares, or an object holding one within two properties:
    // React's events and AbstractView hand out elements and windows under their own names.
    const isBrowserType = (type: ts.Type, depth = 0): boolean => {
      if (type.isUnionOrIntersection()) {
        return type.types.some((part) => isBrowserType(part, depth));
      }
      const symbols = [type.getSymbol(), type.aliasSymbol];
      if (
        symbols.some((symbol) =>
          (symbol?.getDeclarations() ?? []).some((d) => isBrowserDeclaration(program, d)),
        )
      ) {
        return true;
      }
      if (depth >= 2 || (type.flags & ts.TypeFlags.Object) === 0) {
        return false;
      }
      return [
        ...(type.aliasTypeArguments ?? []),
        ...type.getProperties().map((property) => checker.getTypeOfSymbol(property)),
      ].some((part) => isBrowserType(part, depth + 1));
    };

    const checkName = (node: TSESTree.Node) => {
      const symbol = services.getSymbolAtLocation(node);
      const keys = (symbol?.getDeclarations() ?? [])
        .filter((declaration) => isBrowserDeclaration(program, declaration))
        .map((declaration) => keyOf(declaration) ?? symbol?.getName() ?? "?");
      if (keys.length > 0 && !keys.some((key) => allowed.includes(key))) {
        context.report({ node, messageId: "notAllowed", data: { key: keys[0] } });
      }
    };

    const isSink = (call: TSESTree.CallExpression) => {
      const declaration = checker
        .getResolvedSignature(services.esTreeNodeToTSNodeMap.get(call))
        ?.getDeclaration();
      if (declaration === undefined) {
        return false;
      }
      // A sink is React's own function, not a local one that shares its name.
      return (
        isBrowserDeclaration(program, declaration) ||
        (call.callee.type === T.Identifier &&
          sinks.includes(call.callee.name) &&
          declaration.getSourceFile().fileName.includes("/node_modules/@types/react-dom/"))
      );
    };

    // Where a browser value may stand: as the object of a dotted member, as a callee, compared,
    // passed to lib.dom or a sink, bound to an unannotated const, or iterated by for...of.
    const isAllowedPosition = (node: TSESTree.Node): boolean => {
      const parent = node.parent;
      if (parent === undefined) {
        return false;
      }
      switch (parent.type) {
        case T.ChainExpression:
          return isAllowedPosition(parent);
        case T.MemberExpression:
          return parent.object === node && !parent.computed;
        case T.CallExpression:
          return parent.callee === node || isSink(parent);
        case T.BinaryExpression:
          return ["===", "!==", "==", "!="].includes(parent.operator);
        case T.VariableDeclarator:
          return (
            parent.id.type === T.Identifier &&
            parent.id.typeAnnotation === undefined &&
            parent.parent.kind === "const"
          );
        case T.ForOfStatement:
          return parent.right === node;
        default:
          return false;
      }
    };

    const checkValue = (node: TSESTree.Expression) => {
      const type = services.getTypeAtLocation(node);
      if (isBrowserType(type) && !isAllowedPosition(node)) {
        context.report({ node, messageId: "escapes", data: { type: checker.typeToString(type) } });
      }
    };

    return {
      "Program:exit"() {
        for (const scope of context.sourceCode.scopeManager?.scopes ?? []) {
          for (const reference of scope.references) {
            if (reference.isValueReference && reference.identifier.type === T.Identifier) {
              checkName(reference.identifier);
              checkValue(reference.identifier);
            }
          }
        }
      },
      MemberExpression(node) {
        if (!node.computed) {
          checkName(node.property);
        }
        checkValue(node);
      },
      "ObjectPattern > Property"(node: TSESTree.Property) {
        checkName(node.key);
      },
      CallExpression: checkValue,
      NewExpression: checkValue,
      ThisExpression: checkValue,
      AwaitExpression: checkValue,
    };
  },
});

// "x" and {false} or {8} are literals; any other expression is not.
const isLiteral = (value: TSESTree.JSXAttribute["value"]) =>
  value?.type === T.Literal ||
  (value?.type === T.JSXExpressionContainer && value.expression.type === T.Literal);

// ---- local/jsx ------------------------------------------------------------------------------------

/**
 * Lower-case elements and their attributes come from the zone's lists, attributes off the dynamic
 * list take literals only, and a capitalised tag must be a component: a string-typed <Tag> would
 * render whatever element name the string holds.
 */
export const jsxRule = createRule<
  [{ tags: string[]; attributes: string[]; dynamicAttributes: string[] }],
  "tag" | "attribute" | "literal" | "spread" | "name" | "component"
>({
  meta: {
    type: "problem",
    messages: {
      tag: `<{{name}}> は、このゾーンで書ける要素にありません。${fixNotAdd}${readAdr0007}`,
      attribute: `{{name}} は、このゾーンで書ける属性にありません。${fixNotAdd}${readAdr0007}`,
      literal: `{{name}} には、文字列をそのまま書きます。${readAdr0007}`,
      spread: `JSX のスプレッドは使えません。属性を1つずつ書きます。${readAdr0007}`,
      name: `JSX の名前は、要素の名前かコンポーネントの名前だけにします。${readAdr0007}`,
      component: `{{name}} はコンポーネントではありません。${readAdr0007}`,
    },
    schema: [
      {
        type: "object",
        properties: { tags: stringList, attributes: stringList, dynamicAttributes: stringList },
        required: ["tags", "attributes", "dynamicAttributes"],
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ tags: [], attributes: [], dynamicAttributes: [] }],
  },
  create(context, [{ tags, attributes, dynamicAttributes }]) {
    const services = ESLintUtils.getParserServices(context);
    return {
      JSXSpreadAttribute(node) {
        context.report({ node, messageId: "spread" });
      },
      JSXOpeningElement(node) {
        if (node.name.type !== T.JSXIdentifier) {
          context.report({ node: node.name, messageId: "name" });
          return;
        }
        const name = node.name.name;
        if (/^[A-Z]/.test(name)) {
          const type = services.getTypeAtLocation(node.name);
          if (type.getCallSignatures().length === 0 && type.getConstructSignatures().length === 0) {
            context.report({ node: node.name, messageId: "component", data: { name } });
          }
          return;
        }
        if (!tags.includes(name)) {
          context.report({ node: node.name, messageId: "tag", data: { name } });
        }
        for (const attribute of node.attributes) {
          if (attribute.type !== T.JSXAttribute) {
            continue;
          }
          const attributeName =
            attribute.name.type === T.JSXIdentifier
              ? attribute.name.name
              : `${attribute.name.namespace.name}:${attribute.name.name.name}`;
          if (!attributes.includes(attributeName)) {
            context.report({
              node: attribute,
              messageId: "attribute",
              data: { name: attributeName },
            });
          } else if (!isLiteral(attribute.value) && !dynamicAttributes.includes(attributeName)) {
            context.report({
              node: attribute,
              messageId: "literal",
              data: { name: attributeName },
            });
          }
        }
      },
    };
  },
});

// ---- local/imports --------------------------------------------------------------------------------

/**
 * Relative imports, plus the listed names from the listed packages. import type is free, since
 * types do not reach the page. A query or fragment in a path (?url, ?raw) is refused.
 */
export const importsRule = createRule<
  [{ imports: Record<string, string[]>; testImports: Record<string, string[]> }],
  "source" | "name" | "whole"
>({
  meta: {
    type: "problem",
    messages: {
      source: `{{source}} は、このゾーンで読み込めません。${fixNotAdd}${readAdr0007}`,
      name: `{{source}} の {{name}} は、このゾーンで読み込めません。${fixNotAdd}${readAdr0007}`,
      whole: `{{source}} は、名前を1つずつ読み込みます。${readAdr0007}`,
    },
    schema: [
      {
        type: "object",
        properties: {
          imports: { type: "object", additionalProperties: stringList },
          testImports: { type: "object", additionalProperties: stringList },
        },
        required: ["imports", "testImports"],
        additionalProperties: false,
      },
    ],
    defaultOptions: [{ imports: {}, testImports: {} }],
  },
  create(context, [{ imports, testImports }]) {
    const isTest = /\.test\.tsx?$/.test(context.filename);
    const namesFrom = (source: string): readonly string[] | undefined =>
      imports[source] ?? (isTest ? testImports[source] : undefined);
    const check = (
      node:
        | TSESTree.ImportDeclaration
        | TSESTree.ExportNamedDeclaration
        | TSESTree.ExportAllDeclaration,
      source: string,
    ) => {
      if (/^\.\.?\//.test(source)) {
        if (/[?#]/.test(source)) {
          context.report({ node, messageId: "source", data: { source } });
        }
        return;
      }
      const names = namesFrom(source);
      if (names === undefined) {
        context.report({ node, messageId: "source", data: { source } });
        return;
      }
      if (node.type === T.ExportAllDeclaration) {
        context.report({ node, messageId: "whole", data: { source } });
        return;
      }
      const typeOnly = (kind: "type" | "value") => kind === "type";
      if (node.type === T.ImportDeclaration && typeOnly(node.importKind)) {
        return;
      }
      for (const specifier of node.specifiers) {
        if (
          specifier.type === T.ImportDefaultSpecifier ||
          specifier.type === T.ImportNamespaceSpecifier
        ) {
          context.report({ node: specifier, messageId: "whole", data: { source } });
          continue;
        }
        const kind =
          specifier.type === T.ImportSpecifier ? specifier.importKind : specifier.exportKind;
        const imported =
          specifier.type === T.ImportSpecifier ? specifier.imported : specifier.local;
        const name = imported.type === T.Identifier ? imported.name : imported.value;
        if (!typeOnly(kind) && !names.includes(name)) {
          context.report({ node: specifier, messageId: "name", data: { source, name } });
        }
      }
    };
    return {
      ImportDeclaration(node) {
        check(node, node.source.value);
      },
      ExportNamedDeclaration(node) {
        if (node.source !== null) {
          check(node, node.source.value);
        }
      },
      ExportAllDeclaration(node) {
        check(node, node.source.value);
      },
    };
  },
});
