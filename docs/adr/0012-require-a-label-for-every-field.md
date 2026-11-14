# 入力欄のラベルと、ボタンの中身を ESLint で確かめる

ADR 0011 には、ラベルのない入力欄を機械的に止めると書きました。ところが、eslint-plugin-jsx-a11y-x の `strict` には、入力欄にラベルを求めるルールがありません。近いルールの `control-has-associated-label` も、`strict` では切ってあります。そのため、ラベルのない `textarea` と `input`、中身のない `button` を書いても、`bun run lint` は通っていました。

そこで、すべての `.tsx` に次の2つを足します。

- **`jsx-a11y-x/control-has-associated-label` を有効にします。** 中身のない `button` が止まります。オプションは `strict` に入っているものをそのまま使うので、`input` と `textarea` は見ません。このルールは `<label htmlFor>` と `id` の組み合わせを追えず、見るようにすると、正しくラベルを付けた入力欄も止めてしまうためです。
- **`local/field-label` を足します。** `guards/rules.ts` に書いたルールで、`input`、`textarea`、`select` にラベルがなければ止めます。

`local/field-label` がラベルと認めるのは、次のどちらかです。

- 入力欄を囲む `<label>`
- 入力欄の `id` と同じ値を `htmlFor` に持つ、同じファイルの `<label>`

`id` と `htmlFor` は、同じ文字列か、同じ変数を書いたときだけ、同じ値とみなします。別のコンポーネントにある同じ名前の変数は、同じとみなしません。テンプレート文字列のような式も追えないので、止まります。`useId()` の結果を変数に入れ、その変数を `id` と `htmlFor` の両方に書きます。

`aria-label` と `aria-labelledby` は、ラベルと認めません。画面を見て使う人にも、何を入れる欄かが文字で分かるようにするためです。

ラベルの文字があるかは、`strict` の `label-has-associated-control` が確かめます。ルールが働くことは、ADR 0011 と同じく `guard-probes/` の probe で確かめます。`strict` が `recommended` より厳しいことを示す probe（`<ul role="listbox">`）も足しました。

次のものは、このルールでは確かめられません。

- ラベルの文字が、入力欄の中身を正しく表しているか
- `TextBox` のようなコンポーネントを使う側のコード。`src/platform/` の入力欄のコンポーネントは、`label` を省けない引数にしているので、省くと型のチェックで止まります

## Considered Options

- **`control-has-associated-label` で `input` と `textarea` も見る。** 足すルールは1つで済みます。ただ、`<label htmlFor>` と `id` で正しくラベルを付けた `TextBox` と `NumberField` も止まります。
- **描いた HTML をテストで調べる。** `renderToString` の結果から、入力欄ごとにラベルを探します。`id` がどんな式でも調べられます。ただ、新しいコンポーネントをテストに足し忘れると止まりません。ESLint なら、書いた時点ですべての `.tsx` に効くので、ADR 0003 に合います。
- **`aria-label` もラベルと認める。** 見えるラベルを置きにくい画面でも書けます。ただ、今の画面にそうした入力欄はありません。必要になったら、新しい ADR で決めます。
