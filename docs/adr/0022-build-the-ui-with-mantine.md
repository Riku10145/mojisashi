# UI を Mantine で作る

ページの見た目と入力の部品を、Tailwind CSS で書いたものから、UI ライブラリの Mantine（`@mantine/core`）に置き換えます。持ち主が Mantine を使うと決めました。Mantine は MIT License で、商用でも使えます。

Tailwind CSS は外します。`tailwindcss` と `@tailwindcss/vite` を依存から外し、`vite.config.ts` と `scripts/dist-policy.ts` の `referenceBuild` からプラグインを外します。

## Mantine を使う場所

Mantine の部品を読み込むのは `src/platform/` だけにします。`src/shell/` は、`MantineProvider` でページを包むためだけに読み込みます。`src/app/` は Mantine を読み込まず、`src/platform/` が渡す部品を使います。

Mantine の部品は `component` で描く要素を変えられ、`style` やイベントの関数も受け取ります。`src/app/` が直に使うと、`guards/zones.ts` の要素と属性の一覧を通らずに、どの要素でも描けます。`src/platform/` の部品は、文字列、数、決めた値だけを受け取るので、ADR 0007 の決まりは変わりません。リンクの行き先も、`"/"` と `"/dummy-text/"` だけを受け取る型にします。

ページの部品は、レイアウトも文字も Mantine で描きます。`src/platform/` は、`Box`、`Stack`、`List`、`Text` などを、受け取れる props を絞って `src/app/` に渡します。`component` で選べる要素は、`main`、`header`、`dl`、`details` のように決めたものだけです。

Mantine の部品でも、次のものは使いません。

- **`SimpleGrid` と `Grid`。** 列の数を CSS の変数で渡すために、いつも `<style>` を書きます。画面の幅で並べ方を変える所は、`Box` に `src/shell/index.css` のクラスを付けて組みます。
- **`Accordion`。** よくある質問は、JavaScript なしで開け閉めできるように、`Box` で `<details>` と `<summary>` を描きます（ADR 0021）。

## CSP をゆるめずに使う

Mantine は何もしないと3つのものを書きます。どれも `style-src 'self'` と Trusted Types に止められます。

- **CSS の変数を入れる `<style>`。** `MantineProvider` の `withCssVariables={false}` で止めます。決まりの値は、Mantine の `default-css-variables.css` が同じものを持っています。
- **画面の幅で隠すクラスを入れる `<style>`。** `withGlobalClasses={false}` で止めます。このクラスは使いません。
- **要素ごとの `style` 属性。** 部品の大きさや色を、`style="--button-height: …"` のような CSS の変数で渡します。書き出す HTML からは、`src/shell/entry-server.tsx` の `render()` が `style` 属性を外します。同じ値は `src/shell/mantine-styles.css` に、部品のクラスで選ぶルールとして書きます。

`mantine-styles.css` は、`bun scripts/mantine-styles.ts` が2つのページを描いた HTML から作ります。手で直しません。`scripts/mantine-styles.test.ts` は、ファイルの中身が、いまのページから作ったものと同じかを確かめます。部品を足したり props を変えたりしたら、スクリプトを動かし直します。

スクリプトは次のときに止まります。

- `mt` や `c` のような Mantine の style の props を使ったとき。CSS の変数でない値は、`src/shell/index.css` のクラスで書きます。
- 同じルールで選ぶ2つの要素が、違う値を持つとき。props をそろえるか、クラスを足して分けます。`src/platform/` の `Stack` と `List` は、`stack-lg` のように、間の広さをクラスにも書いて分けます。
- ほかの要素のためのルールが当たって、その要素にない変数を足すとき。

ルールは `data-disabled` や `mantine-active` のような、押したり入れたりすると変わる属性とクラスでは選びません。

ブラウザでは、React が書き出した HTML を引き継ぎ（hydration）、`style` 属性を足し直しません。そのあとで値が変わると、React は CSSOM で値を書きます。CSP はこれを止めません。

## 何も残さない

Mantine は色のテーマ（明るい・暗い）を `localStorage` に残します。`src/shell/pages.tsx` で、何も読み書きしない入れ物を渡し、テーマは明るいほうに決めます（ADR 0001）。テーマを選ぶ属性は、JavaScript を待たずに効くように、`index.html` と `dummy-text/index.html` の `<html>` に `data-mantine-color-scheme="light"` と書きます。

## ゆるめる守り

ADR 0013 のとおり、機能に要るので、次の一覧に足します。

- `guards/zones.ts` の platform のゾーンで読み込める、`@mantine/core` の部品の名前。テストでは `MantineProvider` も読み込めます。
- `guards/zones.ts` の shell のゾーンで読み込める `MantineProvider`。
- `scripts/dist-policy.ts` の、ページに入れてよいパッケージ。`@mantine/core`、`@mantine/hooks`、`clsx` を足します。
- `scripts/dist-policy.ts` の、書き出した body に入れてよい要素と属性。ラジオボタンの丸を描く `<svg>` と `<circle>`、その属性の `xmlns`、`fill`、`viewBox`、`cx`、`cy`、`r`、Mantine の CSS が選ぶ `data-*` の属性です。どれもリクエストを生みません。

`guards/rules.ts` の読み込みのルールは、`imports` にあるパッケージを `testImports` にも書くと、`testImports` の名前を読みませんでした。テストでは、2つの一覧の名前を合わせて使うように直します。テストでないファイルで使える名前は変わりません。

## 変わること

- ページの JavaScript は、gzip で 73.1 KB から 96.9 KB に、CSS は 3.5 KB から 9.6 KB になります。
- 数の欄の範囲（「1から100,000までの整数」）は、これまでどおり2つめのラベルにして、欄の名前に入れます。Mantine の `description` は `aria-describedby` で読ませるので使いません。

## Considered Options

- **`src/app/` からも Mantine を読み込む。** 部品の名前を一覧に足すだけで済みます。ただ、`component` や `style` で、要素と属性の一覧を通らない道ができます。
- **CSP の `style-src` に `'unsafe-inline'` を足す。** `style` 属性がそのまま効きます。ただ、`CLAUDE.md` と `guards/config-policy.ts` が CSP をゆるめることを止めています。
- **ページを書き出さず、ブラウザだけで描く。** `style` は CSSOM で書くので、CSP に止められません。ただ、JavaScript を切ると何も出ず、検索エンジンや `llms.txt` の確かめが読む本文もなくなります。
- **書き出すときに、`style` 属性から CSS を作る。** ファイルを手で作り直す手間はなくなります。ただ、`scripts/verify-dist.ts` が `dist/` を同じ設定のビルドと比べる決まりに、書き出しのあとで作る CSS を入れ直すことになります。
