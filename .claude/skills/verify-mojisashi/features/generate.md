# テスト用の文章を作る

決めた文字数ちょうどのテスト用の文章を作り、ページに出して、コピーできるようにします。文字の種類は、日本語（「あいうえお」のくり返し）と英語（小文字の英字をランダムに並べる）から選びます。仕様は `docs/features/generate/README.md` にあります。

## Sub-features

- `generate-length` は、入れた文字数ちょうどの文章を作る。
- `generate-kind` は、文字の種類を選べる。はじめは日本語で、「あいうえお」をくり返して文字数で切る。
- `generate-letters` は、英語を選ぶと、aからzの小文字だけを使う。
- `generate-limit` は、100,000文字まで作れる。1から100,000の整数でないときは、「作る」を押せない。
- `generate-random` は、英語では、作るたびに違う文章を作る。
- `generate-shown` は、作った文章をページの枠の中に出す。
- `generate-copy` は、作った文章をコピーする。貼ると、入れた文字数ちょうどになる。

## How to get to it (user POV)

- ページを開くと、「文字数を数える」の下の「テスト用の文章を作る」の見出しの下にある。
- 「作る文字数」の欄に文字数を入れる。
- 「文字の種類」で、日本語か英語を選ぶ。はじめは日本語が選ばれている。
- 「作る」を押す。作ると、「コピー」のボタンが出て、その下の枠に作った文章が出る。
- 「コピー」を押して、試したい入力欄に貼る。

## Driving it with drive.mjs

Preconditions:

- `bun run build` が通り、`dist/` がソースより新しい。
- 道具を `$SCRATCH/drive.mjs` に取り出してある。道具はクリップボードの読み書きを許している。

確かめること:

- **最初の状態。** 「作る」は押せない。「コピー」のボタンはない。「文字の種類」は日本語が選ばれている。
- **範囲の外。** `0` と `100001` では「作る」を押せない。
- **日本語の200文字。** そのまま `200` で作ってコピーする。クリップボードの中身は、「あいうえお」を40回くり返した200文字。同じ文章がページに出ている。「文章」の欄に貼ると、どちらの数え方でも `200文字`。
- **英語の200文字。** 英語を選び、`200` で作ってコピーする。クリップボードの中身は、aからzだけの200文字で、ページにも出ている。「文章」の欄に貼ると、どちらの数え方でも `200文字`。
- **作り直す。** 英語でもう1回作ると、前と違う文章になる。「コピーしました」は消える。
- **100,000文字。** 英語のまま、全角の `１００，０００` で作ってコピーする。クリップボードの中身は、aからzだけの100,000文字で、26文字すべてが出てくる。「文章」の欄に貼ると、どちらの数え方でも `100,000文字`。

```js scenario
export default async function ({ page, capture, step }) {
  const length = page.getByRole("textbox", { name: "作る文字数" });
  const japanese = page.getByRole("radio", { name: /日本語/ });
  const english = page.getByRole("radio", { name: /英語/ });
  const make = page.getByRole("button", { name: "作る" });
  const copy = page.getByRole("button", { name: "コピー", exact: true });
  const box = page.getByRole("textbox", { name: "文章" });
  const without = page.getByRole("definition").nth(0);
  const withBlanks = page.getByRole("definition").nth(1);
  const clipboard = () => page.evaluate(() => navigator.clipboard.readText());

  step("generate-limit: 作る is disabled before a number", await make.isDisabled());
  step("generate-copy: no コピー button before making", (await copy.count()) === 0);
  step("generate-kind: 日本語 is chosen at first", await japanese.isChecked());

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
    step(
      `generate-shown: the ${raw} made is on the page`,
      (await page.getByText(copied, { exact: true }).count()) === 1,
    );

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

  const kana = await makeCopyAndPaste("200", 200, "200");
  step("generate-kind: 日本語 200 is あいうえお 40 times", kana === "あいうえお".repeat(40));
  await capture("generate-japanese-200");

  await english.check();
  step("generate-kind: 英語 is chosen", await english.isChecked());
  const first = await makeCopyAndPaste("200", 200, "200");
  step("generate-letters: 英語 200 is only a to z", /^[a-z]+$/.test(first));
  await capture("generate-english-200");

  await make.click();
  await page.getByText("コピーしました", { exact: true }).waitFor({ state: "detached", timeout: 5000 });
  step("generate-copy: making again clears コピーしました", true);
  await copy.click();
  await page.getByText("コピーしました", { exact: true }).waitFor({ timeout: 5000 });
  step("generate-random: a second 200 differs from the first", (await clipboard()) !== first);

  const long = await makeCopyAndPaste("１００，０００", 100_000, "100,000");
  step("generate-letters: 英語 100,000 is only a to z", /^[a-z]+$/.test(long));
  step("generate-letters: 100,000 uses all 26 letters", new Set(long).size === 26, String(new Set(long).size));
  await capture("generate-100000");
}
```

## Gotchas

- 道具は `context.grantPermissions(["clipboard-read", "clipboard-write"])` でクリップボードを許しています。これがないと、ヘッドレスの Chromium は「コピーできませんでした」を出し、貼り付けも空になります。
- 貼るときは `ControlOrMeta+V` を押します。`fill` で入れると、貼った文字数を確かめたことになりません。
- 100,000文字を貼ったあとの数え直しは数秒かかります。待つ時間を短くしすぎないでください。
- 文字数の `dd` は、`count.md` と同じく並び順で探しています。
- ページには「文章をコピー」のボタンもあります。「コピー」のボタンは `exact: true` で探します。
