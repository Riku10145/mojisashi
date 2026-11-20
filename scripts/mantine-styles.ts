import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { pages } from "./pages";
import { loadEntryServer } from "./render-app";

const readAdr0022 = "docs/adr/0022-build-the-ui-with-mantine.md を読んでください。";
export const stylesFile = "src/shell/mantine-styles.css";

// Attributes that stay as rendered while the page is open. data-disabled, data-checked,
// data-error and the like change with what the user does, so a rule cannot hang on them.
const stableData = new Set([
  "data-size",
  "data-order",
  "data-variant",
  "data-with-border",
  "data-label-position",
  "data-multiline",
  "data-underline",
]);

// m_* repeats the mantine-Name-part class, and mantine-active and mantine-focus-auto come and go.
const isStableClass = (name: string) => !/^m_|^mantine-[a-z]/.test(name);

function decoded(text: string): string {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

type Styled = { classes: string[]; data: string[]; declarations: string[] };

const selectorOf = ({ classes, data }: Styled) =>
  [...classes.map((name) => `.${name}`), ...data].join("");

const propertyOf = (declaration: string) => declaration.slice(0, declaration.indexOf(":"));

/** Each element that has a style attribute, with what a selector can pick it out by. */
function styledElements(html: string): Styled[] {
  return [...html.matchAll(/<[a-zA-Z][\w-]*((?:\s+[^\s=>/]+(?:="[^"]*")?)*)\s*\/?>/g)].flatMap(
    ([, attributes = ""]) => {
      const values = new Map(
        [...attributes.matchAll(/([^\s=/]+)(?:="([^"]*)")?/g)].map(([, name = "", value = ""]) => [
          name,
          decoded(value),
        ]),
      );
      const style = values.get("style");
      if (style === undefined) {
        return [];
      }
      return [
        {
          classes: (values.get("class") ?? "").split(/\s+/).filter(isStableClass).sort(),
          data: [...values]
            .filter(([name]) => stableData.has(name))
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([name, value]) => `[${name}="${value}"]`),
          declarations: style
            .split(";")
            .map((declaration) => declaration.trim())
            .filter((declaration) => declaration !== ""),
        },
      ];
    },
  );
}

/**
 * The CSS that gives each element the style Mantine rendered inline, one rule per element's
 * selector. Fails when a style holds a property other than a custom property (a style prop such as
 * mt or c, which a class should set), when two elements that one selector picks out need different
 * styles, or when a rule for other elements also picks out an element and gives it a property its
 * own style does not have.
 */
export function mantineStylesCss(htmls: readonly string[]): string {
  const elements = htmls.flatMap(styledElements);
  const rules = new Map<string, Styled>();
  const problems: string[] = [];
  for (const element of elements) {
    const selector = selectorOf(element);
    for (const declaration of element.declarations.filter((each) => !each.startsWith("--"))) {
      problems.push(
        `${selector} の style に ${declaration} があります。Mantine の style の props ではなく、クラスで書きます。${readAdr0022}`,
      );
    }
    const before = rules.get(selector);
    if (selector === "") {
      problems.push(
        `style を持つ要素に、選べるクラスがありません: ${element.declarations.join(";")}。${readAdr0022}`,
      );
    } else if (before === undefined) {
      rules.set(selector, element);
    } else if (before.declarations.join(";") !== element.declarations.join(";")) {
      problems.push(
        `${selector} で選ぶ要素の style が、要素ごとに違います（${before.declarations.join(";")} と ${element.declarations.join(";")}）。props をそろえるか、クラスを足します。${readAdr0022}`,
      );
    }
  }
  for (const element of elements) {
    const own = new Set(element.declarations.map(propertyOf));
    for (const rule of rules.values()) {
      const picks =
        rule.classes.every((name) => element.classes.includes(name)) &&
        rule.data.every((pair) => element.data.includes(pair));
      const extra = rule.declarations.map(propertyOf).filter((property) => !own.has(property));
      if (picks && extra.length > 0) {
        problems.push(
          `${selectorOf(rule)} のルールが ${selectorOf(element)} の要素にも当たり、${extra.join("、")} を足します。クラスを足して分けます。${readAdr0022}`,
        );
      }
    }
  }
  if (problems.length > 0) {
    throw new Error(problems.join("\n"));
  }
  return [
    "/* Written by scripts/mantine-styles.ts from the style attributes Mantine renders, which the CSP refuses (ADR 0022). */",
    ...[...rules]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(
        ([selector, { declarations }]) =>
          `${selector} {\n${declarations.map((each) => `  ${propertyOf(each)}: ${each.slice(each.indexOf(":") + 1).trim()};\n`).join("")}}`,
      ),
    "",
  ].join("\n");
}

/** The CSS for every page in scripts/pages.ts, as the checked-in file should hold it. */
export async function expectedMantineStyles(root: string): Promise<string> {
  const { renderWithStyles } = await loadEntryServer(root);
  return mantineStylesCss(pages.map(({ path }) => renderWithStyles(path)));
}

if (import.meta.main) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  await writeFile(`${root}${stylesFile}`, await expectedMantineStyles(root));
}
