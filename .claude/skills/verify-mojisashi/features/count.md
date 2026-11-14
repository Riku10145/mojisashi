# 文字数を数える

貼った文章の文字数を、「空白と改行を除いた文字数」と「空白と改行を含む文字数」の2つの数え方で同時に出します。目標の文字数を入れると、選んだ数え方で、あと何文字か、何文字オーバーかを出します。

## Sub-features

- `count-both` は、2つの数え方の文字数を同時に出す。
- `count-grapheme` は、組み合わせの絵文字や、濁点を組み合わせた「が」を1文字と数える。
- `count-blank-kinds` は、NBSP とハングルの埋め字を空白として扱い、ゼロ幅スペースのような見えない文字をどちらの数え方でも数えない（ADR 0008）。
- `count-gap` は、目標の文字数との差を「あとN文字」か「N文字オーバー」で出す。
- `count-rule` は、目標と比べる数え方を切り替える。
- `count-target-range` は、目標の文字数が1から1,000,000の整数でないとき、差を出さない。全角の数字と、`1,000` のような桁区切りのカンマは受け付ける。

## How to get to it (user POV)

- ページを開くと、「文字数を数える」の見出しの下にある。ページの切り替えはない。
- 文章は、「文章」の欄に貼るか、そのまま書く。
- 目標の文字数は、「目標の文字数」の欄に入れる。
- 比べる数え方は、「目標と比べる数え方」のラジオボタンで選ぶ。

## Driving it with drive.mjs

Preconditions:

- `bun run build` が通り、`dist/` がソースより新しい。
- 道具を `$SCRATCH/drive.mjs` に取り出してある。

確かめること:

- **最初の状態。** 2つの数え方とも `0文字` で、差の行はない。
- **混ざった文章。** `今日は　晴れ。\nHello, 世界！ 👍🏽` を入れる。空白と改行を除くと16文字、含むと20文字。空白は、全角スペース、改行、半角スペース2つの4つ。
- **見た目の1文字。** `👨‍👩‍👧` と、か（U+304B）に結合用の濁点（U+3099）を続けた「が」を入れる。どちらの数え方でも `2文字`。
- **空白に見える文字と、見えない文字。** `a`、NBSP（U+00A0）、`b`、ゼロ幅スペース（U+200B）、`c`、ハングルの埋め字（U+3164）、`d` を入れる。除いた文字数は4文字、含む文字数は6文字。
- **目標との差。** 混ざった文章に戻し、目標の文字数に全角の `１８` を入れる。`あと2文字` が出る。
- **数え方の切り替え。** 「空白と改行を含む文字数」を選ぶ。`2文字オーバー` に変わる。
- **範囲の外。** 目標の文字数に `0` を入れる。差の行が空になる。

```js scenario
export default async function ({ page, capture, step }) {
  const box = page.getByRole("textbox", { name: "文章" });
  const without = page.getByRole("definition").nth(0);
  const withBlanks = page.getByRole("definition").nth(1);
  const target = page.getByRole("textbox", { name: "目標の文字数" });
  const gap = page.getByText(/^(あと[\d,]+文字|[\d,]+文字オーバー)$/);

  step(
    "count-both: starts at 0 / 0 with no gap line",
    (await without.textContent()) === "0文字" &&
      (await withBlanks.textContent()) === "0文字" &&
      (await gap.count()) === 0,
  );

  await box.fill("今日は　晴れ。\nHello, 世界！ 👍🏽");
  await without.filter({ hasText: /^16文字$/ }).waitFor({ timeout: 5000 });
  step("count-both: 16 without blanks", (await without.textContent()) === "16文字");
  step("count-both: 20 with blanks", (await withBlanks.textContent()) === "20文字", await withBlanks.textContent());

  await box.fill("👨‍👩‍👧\u304b\u3099");
  await without.filter({ hasText: /^2文字$/ }).waitFor({ timeout: 5000 });
  step("count-grapheme: joined emoji and combined が are 1 each", (await withBlanks.textContent()) === "2文字");

  await box.fill("a\u00a0b\u200bc\u3164d");
  await withBlanks.filter({ hasText: /^6文字$/ }).waitFor({ timeout: 5000 });
  step("count-blank-kinds: NBSP and U+3164 are blanks and a zero width space is not counted", (await without.textContent()) === "4文字", await without.textContent());

  await box.fill("今日は　晴れ。\nHello, 世界！ 👍🏽");
  await target.fill("１８");
  await page.getByText("あと2文字", { exact: true }).waitFor({ timeout: 5000 });
  step("count-gap: full-width 18 gives あと2文字", (await gap.textContent()) === "あと2文字", await gap.textContent());

  await page.getByRole("radio", { name: "空白と改行を含む文字数" }).check();
  await page.getByText("2文字オーバー", { exact: true }).waitFor({ timeout: 5000 });
  step("count-rule: switching gives 2文字オーバー", true);
  await capture("count-over");

  await target.fill("0");
  await gap.waitFor({ state: "detached", timeout: 5000 });
  step("count-target-range: 0 hides the gap line", (await gap.count()) === 0);
}
```

## Gotchas

- 文字数の表示は `useDeferredValue` で少し遅れて変わります。`fill` の直後に読まず、期待する値が出るまで `waitFor` で待ちます。
- `fill` で `\r\n` を入れても、ブラウザは入力欄の改行を `\n` にそろえます。Windows の改行が1文字になることは、`src/app/count.test.ts` のテストで確かめます。
- 文字数の `dd` には役割の名前がありません。`getByRole("definition")` の並び順（除いた文字数が先、含む文字数が後）に頼っています。数え方の並びを変えたら、ここも直します。
- 目標の文字数が範囲の外のときは、差の行が空になります。エラーの文言はありません。
- 合成済みの「が」（U+304C）は、どの数え方でも1文字です。結合文字を確かめるには、手順のように `\u304b\u3099` と書きます。エディターで「が」と打つと、合成済みになることがあります。
