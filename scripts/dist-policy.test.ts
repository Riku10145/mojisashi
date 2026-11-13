import { readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  cssProblems,
  htmlProblems,
  provenanceProblems,
  referenceBuild,
  reproductionProblems,
} from "./dist-policy";

const root = fileURLToPath(new URL("../", import.meta.url));
const probes = `${root}guard-probes/build/`;

async function provenanceOf(input: string): Promise<string[]> {
  return provenanceProblems(root, input, await referenceBuild(root, input));
}

describe("guard-probes/build/blocked のファイルを入口にしたビルドは、出どころで止まる", async () => {
  for (const name of await readdir(`${probes}blocked/`)) {
    it(name, async () => {
      expect(await provenanceOf(`${probes}blocked/${name}`)).not.toEqual([]);
    });
  }
});

describe("guard-probes/build/allowed のファイルを入口にしたビルドは通る", async () => {
  for (const name of await readdir(`${probes}allowed/`)) {
    it(name, async () => {
      expect(await provenanceOf(`${probes}allowed/${name}`)).toEqual([]);
    });
  }
});

describe("書き出した index.html", () => {
  const page = (head: string, body = '<div id="root"><main class="p-4">文章</main></div>') =>
    `<!doctype html>\n<html lang="ja">\n  <head>\n${head}\n  </head>\n  <body>\n    ${body}\n  </body>\n</html>\n`;
  const head = [
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta\n  name="description"\n  content="文章の文字数を数える道具です。"\n/>',
    "<title>文字数カウント | mojisashi</title>",
    '<script type="module" crossorigin src="/assets/index-h4HX25Dr.js"></script>',
    '<link rel="stylesheet" crossorigin href="/assets/index-Yy-386kU.css">',
  ].join("\n");

  it("ビルドが書き出す形は通る", () => {
    expect(htmlProblems(page(head))).toEqual([]);
  });

  it("スペルチェックを止めた入力欄は通る", () => {
    const body = '<div id="root"><textarea id="t" rows="8" spellcheck="false"></textarea></div>';
    expect(htmlProblems(page(head, body))).toEqual([]);
  });

  it.each([
    ["インラインのスクリプト", "<script>localStorage.draft = 1</script>"],
    ["インラインのスタイル", "<style>p { color: red }</style>"],
    ["ページを移動する meta", '<meta http-equiv="refresh" content="0;url=https://example.com/">'],
    ["<base>", '<base href="https://example.com/">'],
    ["先読み", '<link rel="preconnect" href="https://example.com">'],
    ["ほかのスクリプト", '<script type="module" src="https://example.com/x.js"></script>'],
  ])("head の %s を止める", (_, tag) => {
    expect(htmlProblems(page(`${head}\n${tag}`))).not.toEqual([]);
  });

  it.each([
    ["スクリプト", '<div id="root"><script>fetch("/log")</script></div>'],
    ["on で始まる属性", '<div id="root" onclick="fetch(1)"></div>'],
    ["style 属性", '<div id="root" style="color: red"></div>'],
    ["画像", '<div id="root"><img src="/pixel?t=x"></div>'],
    ["スペルチェックが動く入力欄", '<div id="root"><textarea id="t"></textarea></div>'],
  ])("body の %s を止める", (_, body) => {
    expect(htmlProblems(page(head, body))).not.toEqual([]);
  });
});

describe("書き出した CSS", () => {
  it("data: の url() は通る", () => {
    expect(cssProblems("a.css", "p{background:url(data:image/png;base64,AA)}")).toEqual([]);
  });

  it.each([
    ["url()", "input[value^=a]{background:url(/a)}"],
    ["引用符つきの url()", 'p{background:url("https://example.com/a")}'],
    ["@import", '@import "https://example.com/a.css";'],
  ])("%s を止める", (_, css) => {
    expect(cssProblems("a.css", css)).not.toEqual([]);
  });
});

describe("dist/ と決めた設定のビルド", () => {
  const expected = new Map([["a.js", "console.log(1)"]]);
  const bytes = (text: string) => new TextEncoder().encode(text);

  it("同じなら通る", () => {
    expect(reproductionProblems(expected, new Map([["a.js", bytes("console.log(1)")]]))).toEqual(
      [],
    );
  });

  it.each([
    ["中身が違う", new Map([["a.js", bytes('console.log(1);localStorage.draft="x"')]])],
    [
      "ファイルが多い",
      new Map([
        ["a.js", bytes("console.log(1)")],
        ["b.js", bytes("")],
      ]),
    ],
    ["ファイルが足りない", new Map<string, Uint8Array>()],
  ])("%s と止める", (_, actual) => {
    expect(reproductionProblems(expected, actual)).not.toEqual([]);
  });
});
