# リンクのプレビューの画像（`public/og.png`）を作る

`public/og.png` は、X や Slack に URL を貼ったときにカードに出る画像です（#34、ADR 0015）。大きさは 1200×630 です。このファイルの HTML を Playwright の Chromium で開き、スクリーンショットを撮って作ります。

画像には、ページの見出し（`文字数カウント`）と、数え方の説明が入っています。見出しや `<title>`、数え方を変えたら、下の HTML を直して作り直します。`index.html` と `dummy-text/index.html` の `og:image:alt` も、画像に合わせて直します。

リポジトリには JavaScript のファイルを置けない（`guards/files.ts`）ので、HTML とスクリプトはこのファイルのコードブロックに書いています。

## 作り方

スクラッチパッドを `$SCRATCH` とします。

```bash
awk '/^```html og.html$/{f=1;next} /^```$/{f=0} f' docs/og-image.md > "$SCRATCH/og.html"
awk '/^```js og.mjs$/{f=1;next} /^```$/{f=0} f' docs/og-image.md > "$SCRATCH/og.mjs"
NODE_PATH=/opt/node-tools/node_modules node "$SCRATCH/og.mjs" "$SCRATCH/og.html" public/og.png
```

`NODE_PATH` は、Playwright が入っている `node_modules` です。クラウドのコンテナでは `/opt/node-tools/node_modules` にあります。

文字は IPA Pゴシック（`IPAPGothic`）で書きます。ほかのフォントで作ると、文字の形と幅が変わります。いまの `og.png` は、IPA Pゴシックが入った Claude Code のクラウドのコンテナで作りました。

## HTML

下の目盛りは、`<i>` を44個並べて描きます。5つごとと10ごとに長くします。

```html og.html
<!doctype html>
<html lang="ja">
  <head>
    <meta charset="utf-8" />
    <style>
      * {
        margin: 0;
        box-sizing: border-box;
      }
      body {
        width: 1200px;
        height: 630px;
        background: #f8fafc;
        font-family: "IPAPGothic", "IPAGothic", sans-serif;
        color: #0f172a;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 96px;
        position: relative;
        overflow: hidden;
      }
      .name {
        font-size: 44px;
        color: #475569;
        letter-spacing: 0.02em;
      }
      h1 {
        font-size: 120px;
        font-weight: bold;
        margin-top: 12px;
        letter-spacing: 0.02em;
      }
      p {
        font-size: 40px;
        color: #334155;
        margin-top: 28px;
      }
      .ruler {
        position: absolute;
        left: 0;
        right: 0;
        bottom: 0;
        height: 72px;
        background: #0f172a;
        display: flex;
        align-items: flex-start;
        padding-left: 96px;
      }
      .ruler i {
        display: block;
        width: 24px;
        flex: none;
        border-left: 3px solid #f8fafc;
        height: 20px;
      }
      .ruler i:nth-child(5n + 1) {
        height: 36px;
      }
      .ruler i:nth-child(10n + 1) {
        height: 52px;
      }
    </style>
  </head>
  <body>
    <div class="name">mojisashi（もじさし）</div>
    <h1>文字数カウント</h1>
    <p>空白と改行を除く・含むの2つの数え方で、すぐに数えます。</p>
    <div class="ruler"><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
  </body>
</html>
```

## スクリプト

引数は、HTML のファイルと、書き出す PNG のファイルです。

```js og.mjs
import { createRequire } from "node:module";
import { resolve } from "node:path";

// An ES import does not read NODE_PATH, and require does.
const require = createRequire(import.meta.url);
const { chromium } = require("playwright");

const [html, png] = process.argv.slice(2);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.goto(`file://${resolve(html)}`);
await page.screenshot({ path: png });
await browser.close();
```
