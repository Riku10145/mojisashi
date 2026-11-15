// An ESLint rule that gives every textarea and input a label (ADR 0017).
import {
  AST_NODE_TYPES as T,
  ASTUtils,
  ESLintUtils,
  type TSESLint,
  type TSESTree,
} from "@typescript-eslint/utils";

const readAdr0017 = "docs/adr/0017-label-every-control.md を読んでください。";
const controls = new Set(["textarea", "input"]);

/** What an id or htmlFor names: a string literal, or the variable an identifier refers to. */
type Target = string | TSESLint.Scope.Variable;

function tagOf(element: TSESTree.JSXOpeningElement): string | undefined {
  return element.name.type === T.JSXIdentifier ? element.name.name : undefined;
}

/**
 * A textarea or input sits inside a <label>, or has an id that a <label htmlFor> in the same file
 * names with the same string or the same variable.
 */
export const controlLabelRule = ESLintUtils.RuleCreator.withoutDocs<[], "unlabelled">({
  meta: {
    type: "problem",
    messages: {
      unlabelled: `<{{name}}> にラベルがありません。<label> の中に置くか、同じファイルの <label htmlFor={id}> と同じ id を付けます。${readAdr0017}`,
    },
    schema: [],
    defaultOptions: [],
  },
  create(context) {
    const targetOf = (element: TSESTree.JSXOpeningElement, name: string): Target | undefined => {
      for (const attribute of element.attributes) {
        if (
          attribute.type !== T.JSXAttribute ||
          attribute.name.type !== T.JSXIdentifier ||
          attribute.name.name !== name
        ) {
          continue;
        }
        const value = attribute.value;
        if (value?.type === T.Literal && typeof value.value === "string") {
          return value.value;
        }
        if (value?.type === T.JSXExpressionContainer && value.expression.type === T.Identifier) {
          const scope = context.sourceCode.getScope(value.expression);
          return ASTUtils.findVariable(scope, value.expression) ?? undefined;
        }
      }
      return undefined;
    };

    const named = new Set<Target>();
    const unwrapped: { element: TSESTree.JSXOpeningElement; name: string }[] = [];
    return {
      JSXOpeningElement(element) {
        const name = tagOf(element);
        if (name === "label") {
          const target = targetOf(element, "htmlFor");
          if (target !== undefined) {
            named.add(target);
          }
          return;
        }
        if (name === undefined || !controls.has(name)) {
          return;
        }
        const wrapped = context.sourceCode
          .getAncestors(element)
          .some(
            (ancestor) =>
              ancestor.type === T.JSXElement && tagOf(ancestor.openingElement) === "label",
          );
        if (!wrapped) {
          unwrapped.push({ element, name });
        }
      },
      "Program:exit"() {
        for (const { element, name } of unwrapped) {
          const id = targetOf(element, "id");
          if (id === undefined || !named.has(id)) {
            context.report({ node: element, messageId: "unlabelled", data: { name } });
          }
        }
      },
    };
  },
});
