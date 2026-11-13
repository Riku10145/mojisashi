import { fileURLToPath } from "node:url";
import { fileProblems } from "../guards/files";

const listed = Bun.spawnSync(["git", "ls-files", "-z"], {
  cwd: fileURLToPath(new URL("../", import.meta.url)),
});
if (listed.exitCode !== 0) {
  throw new Error(`git ls-files が終了コード ${String(listed.exitCode)} で止まりました`);
}
const tracked = listed.stdout
  .toString()
  .split("\0")
  .filter((file) => file !== "");
const problems = fileProblems(tracked);
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}
console.log(`${String(tracked.length)} 個のファイルは、どれも決めた種類です`);
