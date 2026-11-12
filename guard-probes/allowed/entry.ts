const root = document.getElementById("root");
if (root === null) {
  throw new Error("#root が index.html にありません");
}
const isPrerendered = Array.from(root.childNodes).some((node) =>
  node.nodeType === Node.TEXT_NODE
    ? node.textContent?.trim() !== ""
    : node.nodeType !== Node.COMMENT_NODE,
);
document.title = isPrerendered ? "文字数カウント" : "mojisashi";
root.addEventListener("input", () => {
  root.classList.toggle("is-dirty", true);
});
