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

async function builtPageOf(input: string): Promise<{ provenance: string[]; html: string[] }> {
  const files = await referenceBuild(root, input);
  const decoder = new TextDecoder();
  const pages = files.filter((file) => file.name.endsWith(".html"));
  expect(pages).toHaveLength(1);
  return {
    provenance: provenanceProblems(root, input, files),
    html: pages.flatMap((file) =>
      htmlProblems(typeof file.content === "string" ? file.content : decoder.decode(file.content)),
    ),
  };
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

describe("guard-probes/build/head/blocked のページは、書き出した head で止まる", async () => {
  for (const name of await readdir(`${probes}head/blocked/`)) {
    it(name, async () => {
      expect((await builtPageOf(`${probes}head/blocked/${name}`)).html).not.toEqual([]);
    });
  }
});

describe("guard-probes/build/head/allowed のページは通る", async () => {
  for (const name of await readdir(`${probes}head/allowed/`)) {
    it(name, async () => {
      expect(await builtPageOf(`${probes}head/allowed/${name}`)).toEqual({
        provenance: [],
        html: [],
      });
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

  it("検索とリンクのプレビューのためのタグは通る", () => {
    const seo = [
      '<link rel="canonical" href="https://mojisashi.app/" />',
      '<meta property="og:title" content="文字数カウント | mojisashi" />',
      '<meta property="og:description" content="文章の文字数を数える道具です。" />',
      '<meta property="og:type" content="website" />',
      '<meta property="og:url" content="https://mojisashi.app/" />',
      '<meta property="og:site_name" content="mojisashi" />',
      '<meta property="og:locale" content="ja_JP" />',
      '<meta property="og:image" content="https://mojisashi.app/og.png" />',
      '<meta property="og:image:alt" content="mojisashi" />',
      '<meta property="og:image:width" content="1200" />',
      '<meta property="og:image:height" content="630" />',
      '<meta name="twitter:card" content="summary_large_image" />',
      '<meta name="twitter:title" content="文字数カウント | mojisashi" />',
      '<meta name="twitter:description" content="文章の文字数を数える道具です。" />',
      '<meta name="twitter:image" content="https://mojisashi.app/og.png" />',
      '<meta name="twitter:image:alt" content="mojisashi" />',
      '<script type="application/ld+json">\n  {"@context":"https://schema.org","@type":"WebApplication"}\n</script>',
    ].join("\n");
    expect(htmlProblems(page(`${head}\n${seo}`))).toEqual([]);
  });

  it("スペルチェックと autocomplete を止めた入力欄は通る", () => {
    const body =
      '<div id="root"><textarea id="t" rows="8" spellcheck="false" autocomplete="off"></textarea></div>';
    expect(htmlProblems(page(head, body))).toEqual([]);
  });

  it.each([
    ["インラインのスクリプト", "<script>localStorage.draft = 1</script>"],
    ["インラインのスタイル", "<style>p { color: red }</style>"],
    ["ページを移動する meta", '<meta http-equiv="refresh" content="0;url=https://example.com/">'],
    ["<base>", '<base href="https://example.com/">'],
    ["先読み", '<link rel="preconnect" href="https://example.com">'],
    ["ほかのスクリプト", '<script type="module" src="https://example.com/x.js"></script>'],
    ["別の URL の canonical", '<link rel="canonical" href="https://example.com/" />'],
    ["dev の URL の canonical", '<link rel="canonical" href="https://dev.mojisashi.app/" />'],
    ["別の URL の og:url", '<meta property="og:url" content="https://example.com/" />'],
    ["別の画像の og:image", '<meta property="og:image" content="https://example.com/a.png" />'],
    ["別の画像の twitter:image", '<meta name="twitter:image" content="/og.png" />'],
    ["数でない画像の幅", '<meta property="og:image:width" content="100%" />'],
    ["決めていない og:*", '<meta property="og:video" content="https://example.com/a.mp4" />'],
    ["決めていない twitter:*", '<meta name="twitter:site" content="@mojisashi" />'],
    ["src 付きの JSON-LD", '<script type="application/ld+json" src="/a.json">{}</script>'],
    ["空白を足した JSON-LD", '<script  type="application/ld+json" >{}</script>'],
    ["JSON でない JSON-LD", '<script type="application/ld+json">fetch("/log")</script>'],
    ["オブジェクトでない JSON-LD", '<script type="application/ld+json">"mojisashi"</script>'],
    ["配列の JSON-LD", '<script type="application/ld+json">[{}]</script>'],
    ["< を含む JSON-LD", '<script type="application/ld+json">{"a":"<b>"}</script>'],
    [
      "スクリプトのタグの中の JSON-LD",
      '<script type="module" <script type="application/ld+json">{}</script>crossorigin src="/assets/a.js"></script>',
    ],
    [
      "スタイルシートの URL の中の JSON-LD",
      '<link rel="stylesheet" crossorigin href="/assets/a<script type="application/ld+json">{}</script>.css">',
    ],
    [
      "meta の content の中の JSON-LD",
      '<meta property="og:title" content="a<script type="application/ld+json">{}</script>b" />',
    ],
    ["title の中の JSON-LD", '<title>a<script type="application/ld+json">{}</script>b</title>'],
    [
      "属性を足した JSON-LD",
      '<script type="application/ld+json" id="ld">{"@type":"WebApplication"}</script>',
    ],
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

  it("autocomplete を止めていない入力欄を止める", () => {
    const body = '<div id="root"><textarea id="t" spellcheck="false"></textarea></div>';
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
    ["-webkit-image-set()", "p{background:-webkit-image-set(var(--u) 1x)}"],
    ["src()", "p{background-image:src(var(--u))}"],
    ["image()", "p{list-style-image:image('/a')}"],
  ])("%s を止める", (_, css) => {
    expect(cssProblems("a.css", css)).not.toEqual([]);
  });

  it("カスタムプロパティの文字列を読み込む image-set() を止める", () => {
    const css =
      ".\\[--u\\:\\'\\/l\\/0-1\\'\\]{--u:'/l/0-1'}.b{background-image:image-set(var(--u) 1x)}";
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
