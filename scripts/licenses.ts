import { readFile, readdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { shippedPackages } from "./dist-policy";

export const licensesFile = "public/licenses.txt";

/** The license text a package ships, from its LICENSE file (or license, LICENSE.md and the like). */
async function licenseOf(root: string, name: string): Promise<string> {
  const dir = `${root}node_modules/${name}/`;
  const file = (await readdir(dir)).find((entry) => /^licen[cs]e(\.md|\.txt)?$/i.test(entry));
  if (file === undefined) {
    throw new Error(
      `${name} にライセンスのファイルがありません。docs/adr/0022-build-the-ui-with-mantine.md を読んでください。`,
    );
  }
  return (await readFile(`${dir}${file}`, "utf8")).trim();
}

/**
 * The copyright notices and license texts of the packages whose code the page ships. MIT asks
 * that they go with every copy, and the bundle drops the packages' comments (ADR 0022).
 */
export async function licensesText(root: string): Promise<string> {
  const sections = await Promise.all(
    shippedPackages.map(async (name) => `==> ${name} <==\n\n${await licenseOf(root, name)}\n`),
  );
  // Cloudflare serves .txt without a charset, so a browser reads anything past ASCII as windows-1252.
  return [
    "The pages of mojisashi include code from the packages below. Each one's license follows in full.",
    "",
    ...sections,
  ].join("\n");
}

if (import.meta.main) {
  const root = fileURLToPath(new URL("../", import.meta.url));
  await writeFile(`${root}${licensesFile}`, await licensesText(root));
}
