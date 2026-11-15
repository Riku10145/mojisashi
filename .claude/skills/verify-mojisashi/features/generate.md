# テスト用の文章を作る

決めた文字数ちょうどの、小文字の英字をランダムに並べたテスト用の文章を作り、コピーできるようにします。仕様は `docs/features/generate/README.md` にあります。

## Sub-features

- `generate-length` は、入れた文字数ちょうどの文章を作る。
- `generate-letters` は、aからzの小文字だけを使う。
- `generate-limit` は、100,000文字まで作れる。1から100,000の整数でないときは、「作る」を押せない。
- `generate-random` は、作るたびに違う文章を作る。
- `generate-copy` は、作った文章をコピーする。貼ると、入れた文字数ちょうどになる。

## How to get to it (user POV)

- ページを開くと、「文字数を数える」の下の「テスト用の文章を作る」の見出しの下にある。
- 「作る文字数」の欄に文字数を入れ、「作る」を押す。
- 作ると「コピー」のボタンが出る。押して、試したい入力欄に貼る。

## Driving it with drive.mjs

Preconditions:

- `bun run build` が通り、`dist/` がソースより新しい。
- 道具を `$SCRATCH/drive.mjs` に取り出してある。道具はクリップボードの読み書きを許している。

確かめること:

- **最初の状態。** 「作る」は押せない。「コピー」のボタンはない。
- **範囲の外。** `0` と `100001` では「作る」を押せない。
- **200文字。** `200` で作ってコピーする。クリップボードの中身は、aからzだけの200文字。「文章」の欄に貼ると、どちらの数え方でも `200文字`。
- **作り直す。** もう1回作ると、前と違う文章になる。「コピーしました」は消える。
- **100,000文字。** 全角の `１００，０００` で作ってコピーする。クリップボードの中身は、aからzだけの100,000文字で、26文字すべてが出てくる。「文章」の欄に貼ると、どちらの数え方でも `100,000文字`。

```js scenario
export default async function ({ page, capture, step }) {
  const length = page.getByRole("textbox", { name: "作る文字数" });
  const make = page.getByRole("button", { name: "作る" });
  const copy = page.getByRole("button", { name: "コピー" });
  const box = page.getByRole("textbox", { name: "文章" });
  const without = page.getByRole("definition").nth(0);
  const withBlanks = page.getByRole("definition").nth(1);
  const clipboard = () => page.evaluate(() => navigator.clipboard.readText());

  step("generate-limit: 作る is disabled before a number", await make.isDisabled());
  step("generate-copy: no コピー button before making", (await copy.count()) === 0);

  for (const raw of ["0", "100001"]) {
    await length.fill(raw);
    step(`generate-limit: 作る is disabled for ${raw}`, await make.isDisabled());
  }

  async function makeCopyAndPaste(raw, expected, shown) {
    await length.fill(raw);
    await make.click();
    await page.getByText(`${shown}文字のテスト用の文章を作りました`, { exact: true }).waitFor({ timeout: 10000 });
    await copy.click();
    await page.getByText("コピーしました", { exact: true }).waitFor({ timeout: 10000 });
    const copied = await clipboard();
    step(`generate-length: ${raw} copies ${expected} characters`, copied.length === expected, String(copied.length));
    step(`generate-letters: ${raw} is only a to z`, /^[a-z]+$/.test(copied));

    await box.fill("");
    await box.focus();
    await page.keyboard.press("ControlOrMeta+V");
    await without.filter({ hasText: new RegExp(`^${shown}文字$`) }).waitFor({ timeout: 20000 });
    step(
      `generate-copy: pasting ${raw} gives ${shown}文字 both ways`,
      (await without.textContent()) === `${shown}文字` && (await withBlanks.textContent()) === `${shown}文字`,
      `${await without.textContent()} / ${await withBlanks.textContent()}`,
    );
    return copied;
  }

  const first = await makeCopyAndPaste("200", 200, "200");
  await capture("generate-200");

  await make.click();
  await page.getByText("コピーしました", { exact: true }).waitFor({ state: "detached", timeout: 5000 });
  step("generate-copy: making again clears コピーしました", true);
  await copy.click();
  await page.getByText("コピーしました", { exact: true }).waitFor({ timeout: 5000 });
  step("generate-random: a second 200 differs from the first", (await clipboard()) !== first);

  const long = await makeCopyAndPaste("１００，０００", 100_000, "100,000");
  step("generate-letters: 100,000 uses all 26 letters", new Set(long).size === 26, String(new Set(long).size));
  await capture("generate-100000");
}
```

## Gotchas

- 道具は `context.grantPermissions(["clipboard-read", "clipboard-write"])` でクリップボードを許しています。これがないと、ヘッドレスの Chromium は「コピーできませんでした」を出し、貼り付けも空になります。
- 貼るときは `ControlOrMeta+V` を押します。`fill` で入れると、貼った文字数を確かめたことになりません。
- 100,000文字を貼ったあとの数え直しは数秒かかります。待つ時間を短くしすぎないでください。
- 文字数の `dd` は、`count.md` と同じく並び順で探しています。
