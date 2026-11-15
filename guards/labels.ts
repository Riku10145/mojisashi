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

/** Where a control's accessible name comes from. */
type Naming = "label" | "value" | "none";

/** Input types a <label> does not name: hidden has no name, and button inputs show their value. */
const inputNaming = new Map<string, Naming>([
  ["hidden", "none"],
  ["submit", "value"],
  ["reset", "value"],
  ["button", "value"],
]);

/** What an id or htmlFor names: a string, or the variable an identifier refers to. */
type Target = string | TSESLint.Scope.Variable;

function tagOf(element: TSESTree.JSXOpeningElement): string | undefined {
  return element.name.type === T.JSXIdentifier ? element.name.name : undefined;
}

function attributeOf(
  element: TSESTree.JSXOpeningElement,
  name: string,
): TSESTree.JSXAttribute | undefined {
  for (const attribute of element.attributes) {
    if (
      attribute.type === T.JSXAttribute &&
      attribute.name.type === T.JSXIdentifier &&
      attribute.name.name === name
    ) {
      return attribute;
    }
  }
  return undefined;
}

/** The string of `x="s"`, `x={"s"}` or x={`s`}. */
function stringOf(attribute: TSESTree.JSXAttribute | undefined): string | undefined {
  const value = attribute?.value;
  const literal = value?.type === T.JSXExpressionContainer ? value.expression : value;
  if (literal?.type === T.Literal && typeof literal.value === "string") {
    return literal.value;
  }
  if (literal?.type === T.TemplateLiteral && literal.expressions.length === 0) {
    return literal.quasis[0]?.value.cooked ?? undefined;
  }
  return undefined;
}

function namingOf(element: TSESTree.JSXOpeningElement, tag: string): Naming {
  const type = tag === "input" ? stringOf(attributeOf(element, "type")) : undefined;
  return (type === undefined ? undefined : inputNaming.get(type)) ?? "label";
}

/**
 * A textarea or input sits inside a <label> without htmlFor, or has an id that a <label htmlFor>
 * in the same file names with the same string or the same variable. Button inputs need a value.
 */
export const controlLabelRule = ESLintUtils.RuleCreator.withoutDocs<[], "unlabelled" | "noValue">({
  meta: {
    type: "problem",
    messages: {
      unlabelled: `<{{name}}> にラベルがありません。htmlFor のない <label> の中に置くか、同じファイルの <label htmlFor={id}> と同じ id を付けます。${readAdr0017}`,
      noValue: `ボタンの <input> に名前がありません。value に、何をするボタンかを書きます。${readAdr0017}`,
    },
    schema: [],
    defaultOptions: [],
  },
  create(context) {
    const targetOf = (element: TSESTree.JSXOpeningElement, name: string): Target | undefined => {
      const attribute = attributeOf(element, name);
      const text = stringOf(attribute);
      if (text !== undefined) {
        return text;
      }
      const value = attribute?.value;
      if (value?.type === T.JSXExpressionContainer && value.expression.type === T.Identifier) {
        const scope = context.sourceCode.getScope(value.expression);
        return ASTUtils.findVariable(scope, value.expression) ?? undefined;
      }
      return undefined;
    };

    const named = new Set<Target>();
    const needsId: { element: TSESTree.JSXOpeningElement; name: string }[] = [];
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
        const naming = namingOf(element, name);
        if (naming === "value" && (stringOf(attributeOf(element, "value"))?.trim() ?? "") === "") {
          context.report({ node: element, messageId: "noValue" });
        }
        if (naming !== "label") {
          return;
        }
        // A <label htmlFor> labels the element it names, not the control inside it.
        const label = context.sourceCode
          .getAncestors(element)
          .flatMap((ancestor) => (ancestor.type === T.JSXElement ? [ancestor.openingElement] : []))
          .findLast((opening) => tagOf(opening) === "label");
        if (label === undefined || attributeOf(label, "htmlFor") !== undefined) {
          needsId.push({ element, name });
        }
      },
      "Program:exit"() {
        for (const { element, name } of needsId) {
          const id = targetOf(element, "id");
          if (id === undefined || !named.has(id)) {
            context.report({ node: element, messageId: "unlabelled", data: { name } });
          }
        }
      },
    };
  },
});
