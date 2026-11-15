# 入力欄にはラベルを、ボタンには名前を付ける

ADR 0011 で、eslint-plugin-jsx-a11y-x の `strict` を使うと決めました。ただ、`strict` でも、ラベルのない入力欄と、中身のないボタンは止まりません（issue #21）。次のコードを `src/platform/` に置いても、`bun run lint` を通っていました。

```tsx
export const Bare = () => <div><textarea /><input type="text" /><button type="button" /></div>;
```

理由は2つです。

- `strict` は `control-has-associated-label` を切っています。このルールが、ボタンのような操作する要素に名前があるかを確かめます。
- `label-has-associated-control` は、`<label>` の側から確かめるルールです。`<label>` がなければ、何も言いません。

名前のない入力欄やボタンは、スクリーンリーダーで使う人に、何をするものかが伝わりません。そこで、ADR 0003 のとおり、機械的に止めます。

## 決めたこと

すべての `.tsx` に、次の2つのルールを使います。

- **`jsx-a11y-x/control-has-associated-label`。** 中身のないボタンを止めます。除く要素は、プラグインの `recommended` と同じ7つです。`audio`、`canvas`、`embed`、`input`、`textarea`、`tr`、`video` です。このルールは、入力欄の外に置いた `<label htmlFor>` を見られません。`input` と `textarea` を除かないと、`TextBox` のような正しい組み合わせも止めます。`recommended` の `ignoreRoles` は使いません。`listbox` のような役割を付けた要素にも、名前を求めます。
- **`local/control-label`（`guards/labels.ts`）。** `textarea` と `input` に、次のどちらかを求めます。
  - `<label>` の中に置く。`Choice` のラジオボタンが、この形です。
  - `id` を付け、同じファイルの `<label htmlFor>` が同じ値を指す。同じ値とは、同じ文字列か、同じ変数です。`TextBox` と `NumberField` は、`useId()` で作った変数を両方に渡します。

`aria-label` と `aria-labelledby` は認めません。目で見て使う人にも、何をする欄かを見せるためです。ラベルと入力欄を別のファイルに分けると止まるので、同じファイルに置きます。別の関数の変数は、名前が同じ `id` でも、同じ値とはみなしません。

ルールが働くことは、`guard-probes/` の probe で確かめます。

- `blocked/` に、中身のないボタン、ラベルのない `textarea`、ラベルのない `input`、別の関数の `id` を指す `<label htmlFor>` を置きます。
- `<ul role="listbox">` も `blocked/` に置きます。`recommended` は通し、`strict` は止めるものです。`strict` を使っていることを確かめます。
- `allowed/` に、正しい3つの形を置きます。`htmlFor` と `id` に同じ変数を渡すもの、同じ文字列を書くもの、`<label>` の中に置くものです。前からある `allowed/` の probe のうち、ラベルのない `textarea` を書いていた2つは、`<label>` の中に入れました。

ESLint はコードしか見ないので、書き出した HTML で `id` と `for` が合うかまでは確かめません。確かめるのは、コードで同じ変数か同じ文字列を指すことまでです。

## Considered Options

- **部品を HTML に書き出すテストで確かめる。** `react-dom/server` の `renderToString` で書き出し、どの `textarea` と `input` にも `<label for>` があるかを見ます。書き出した HTML を見るので、`id` が本当に合うかまで分かります。ただ、テストに書いた部品しか確かめません。部品を足したらテストにも足す必要があり、忘れると止まりません。上の `Bare` は、どのテストも書き出さないので通ります。ESLint のルールは、すべての `.tsx` を見ます。機械的に止まるほうを選びました。
- **`control-has-associated-label` で、`input` と `textarea` も確かめる。** ルールが1つで済みます。ただ、外にある `<label htmlFor>` を見られないので、`TextBox` と `NumberField` のような正しい書き方を止めます。
- **`aria-label` と `aria-labelledby` も認める。** ラベルを画面に出さずに済みます。ただ、目で見て使う人には何の欄かが伝わりません。いまの部品は、どれも見えるラベルを付けています。
