# 文章の扱い

貼った文章は、サーバーに送らず、ブラウザにも残しません。ページを閉じたり再読み込みしたりすると、文章は消えます。文章の欄では、文章を Google に送る Chrome の強化スペルチェックと、文章をプロファイルに書く自動入力を切っています（ADR 0001、ADR 0007）。

## Sub-features

- `text-no-network` は、ページを開いて文章を入れても、ページの住所の外へ要求を出さない。
- `text-no-storage` は、文章を cookie、`localStorage`、`sessionStorage`、IndexedDB に残さない。
- `text-reload-clears` は、再読み込みで文章を消す。
- `text-spellcheck-off` は、文章の欄の `spellcheck` を `false` にする。
- `text-autocomplete-off` は、文章の欄の `autocomplete` を `off` にする。
- `text-csp` は、本番と同じ CSP の下で、違反を1つも出さない。

## How to get to it (user POV)

- ページを開き、「文章」の欄に文章を貼る。
- 貼ったあと、ページを再読み込みする。

## Driving it with drive.mjs

Preconditions:

- `bun run build` が通り、`dist/` がソースより新しい。
- 道具を `$SCRATCH/drive.mjs` に取り出してある。

確かめること:

- **欄の設定。** 「文章」の欄の `spellcheck` が `false`、`autocomplete` が `off`。
- **長い文章。** 「あ」を100,000文字入れる。どちらの数え方でも `100,000文字` が出る。
- **残さない。** 文章を入れたあと、cookie、Web Storage、IndexedDB が空。
- **再読み込み。** ページを再読み込みすると、「文章」の欄が空。
- **送らない、CSP。** 道具が最後に、住所の外への要求、コンソールのエラーと警告、捕まえていない例外がないことを確かめる。

```js scenario
export default async function ({ page, storage, capture, step }) {
  const box = page.getByRole("textbox", { name: "文章" });
  const without = page.getByRole("definition").nth(0);

  step("text-spellcheck-off", (await box.getAttribute("spellcheck")) === "false");
  step("text-autocomplete-off", (await box.getAttribute("autocomplete")) === "off");

  await box.fill("あ".repeat(100_000));
  await without.filter({ hasText: /^100,000文字$/ }).waitFor({ timeout: 10000 });
  step("a 100,000-character 文章 is counted", (await without.textContent()) === "100,000文字");
  await box.fill("応募書類の下書き。人に見せたくない文章。");
  await without.filter({ hasText: /^20文字$/ }).waitFor({ timeout: 5000 });

  const stored = await storage();
  step(
    "text-no-storage: cookies, Web Storage and IndexedDB are empty",
    stored.cookies === 0 && stored.localStorage === 0 && stored.sessionStorage === 0 && stored.indexedDB.length === 0,
    JSON.stringify(stored),
  );

  await page.reload({ waitUntil: "load" });
  step("text-reload-clears: 文章 is empty after reload", (await box.inputValue()) === "", await box.inputValue());
  await capture("text-after-reload");
}
```

## Gotchas

- 道具は、`https://mojisashi.test/` 以外への要求を止めて記録します。ただ、CSP の `connect-src 'none'` がブラウザの中で先に止めるので、通信のコードがあっても、まず CSP の違反としてコンソールに出ます。どちらかが出たら失敗です。
- `text-no-storage` は、ページが Web の仕組みで残すものだけを見ます。Chrome がプロファイルの `Sessions/` に書く入力欄の中身は、ヘッドレスの一時的なプロファイルでは確かめられません。そちらは `text-autocomplete-off` の属性の確認が守ります。`text-reload-clears` は、`autocomplete="off"` を外しても通ります。再読み込みの手順だけで ADR 0001 を確かめたことにしないでください。
- 100,000文字の `fill` は数秒かかります。待つ時間を短くしすぎないでください。
