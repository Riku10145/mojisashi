# ページ

mojisashi のページは、文字数を数える `/` と、テスト用の文章を作る `/dummy-text/` の2つです（ADR 0020）。どちらのページも、書き出した HTML に本文が入っていて、JavaScript を切っても見出し、説明、入力欄、よくある質問が見えます。2つのページは、説明の文の中のリンクで行き来します。

## Sub-features

- `pages-top` は、`/` に文字数を数える機能だけを置く。`<title>` は「文字数カウント | mojisashi」、見出しは「文字数カウント」で、「作る文字数」の欄はない。
- `pages-dummy-text` は、`/dummy-text/` にテスト用の文章を作る機能だけを置く。`<title>` は「ダミーテキスト生成（文字数指定・日本語と英語） | mojisashi」、見出しは「テスト用の文章を作る」で、「文章」の欄はない。
- `pages-links` は、`/` の「テスト用の文章を作る」のリンクで `/dummy-text/` へ、`/dummy-text/` の「文字数カウント」のリンクで `/` へ移る。
- `pages-no-js` は、JavaScript を切っても、どちらのページも見出しと入力欄とよくある質問を見せる。

## How to get to it (user POV)

- ブラウザで `https://mojisashi.app/` を開く。
- `/` の説明の文にある「テスト用の文章を作る」のリンクを押す。
- `/dummy-text/` の説明の文にある「文字数カウント」のリンクを押す。
- 検索や共有のリンクから `https://mojisashi.app/dummy-text/` を直に開く。

## Driving it with drive.mjs

Preconditions:

- `bun run build` が通り、`dist/` がソースより新しい。
- 道具を `$SCRATCH/drive.mjs` に取り出してある。

確かめること:

- **トップ。** `/` の `<title>` と見出しが決めたとおりで、「文章」の欄があり、「作る文字数」の欄がない。
- **作るページへ。** 「テスト用の文章を作る」のリンクを押すと、URL が `/dummy-text/` になる。`<title>` と見出しが決めたとおりで、「作る文字数」の欄があり、「文章」の欄がない。
- **トップへ。** 「文字数カウント」のリンクを押すと、URL が `/` に戻る。
- **JavaScript なし。** スクリプトを止めて2つのページを開き直す。どちらも見出し、入力欄、「よくある質問」が見える。

```js scenario
export default async function ({ page, open, capture, step }) {
  const heading = (name) => page.getByRole("heading", { level: 1, name, exact: true });
  const countBox = page.getByRole("textbox", { name: "文章" });
  const lengthBox = page.getByRole("textbox", { name: "作る文字数" });
  const faq = page.getByRole("heading", { level: 2, name: "よくある質問" });

  step("pages-top: / is titled 文字数カウント | mojisashi", (await page.title()) === "文字数カウント | mojisashi", await page.title());
  step("pages-top: / has the 文字数カウント heading", (await heading("文字数カウント").count()) === 1);
  step("pages-top: / has the 文章 field and no 作る文字数 field", (await countBox.count()) === 1 && (await lengthBox.count()) === 0);
  await capture("pages-top");

  await page.getByRole("link", { name: "テスト用の文章を作る" }).click();
  await page.waitForURL("**/dummy-text/");
  step("pages-links: the link on / opens /dummy-text/", new URL(page.url()).pathname === "/dummy-text/", page.url());
  const title = "ダミーテキスト生成（文字数指定・日本語と英語） | mojisashi";
  step("pages-dummy-text: /dummy-text/ has its own title", (await page.title()) === title, await page.title());
  step("pages-dummy-text: /dummy-text/ has the テスト用の文章を作る heading", (await heading("テスト用の文章を作る").count()) === 1);
  step(
    "pages-dummy-text: /dummy-text/ has the 作る文字数 field and no 文章 field",
    (await lengthBox.count()) === 1 && (await countBox.count()) === 0,
  );
  await capture("pages-dummy-text");

  await page.getByRole("link", { name: "文字数カウント" }).click();
  await page.waitForURL((url) => url.pathname === "/");
  step("pages-links: the link on /dummy-text/ opens /", new URL(page.url()).pathname === "/", page.url());

  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: true });
  for (const [path, name, field] of [["/", "文字数カウント", countBox], ["/dummy-text/", "テスト用の文章を作る", lengthBox]]) {
    await open(path);
    step(
      `pages-no-js: ${path} shows its heading, its field and よくある質問 without JavaScript`,
      (await heading(name).isVisible()) && (await field.isVisible()) && (await faq.isVisible()),
    );
    await capture(`pages-no-js${path.replaceAll("/", "-")}`);
  }
  await cdp.send("Emulation.setScriptExecutionDisabled", { value: false });
  await open("/");
}
```

## Gotchas

- 道具は Cloudflare の転送をまねしません。`/dummy-text`（末尾の `/` なし）は、本番では `/dummy-text/` へ転送されますが、道具では 404 になります。転送は dev環境で確かめます。
- リンクの名前「テスト用の文章を作る」は、`/dummy-text/` では見出しの名前でもあります。リンクは `getByRole("link")` で探します。
- JavaScript を切るのは、CDP の `Emulation.setScriptExecutionDisabled` です。切ったまま次の手順に進むと、どの操作も動かないので、最後に戻します。
