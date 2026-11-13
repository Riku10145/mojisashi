# mojisashi

## 先に読むもの

- `README.md` に、何を作るかと、使う人への約束を書いています。
- `GLOSSARY.md` は用語集です。コード、画面の文言、コミットでもここの言葉を使います。
- `docs/adr/` に、決めたことと理由を書いています。
- `docs/features/` に、機能ごとの使い方を書いています。

## コマンド

- `bun install` で依存を入れます。lefthook のコミット前チェックも入ります。lefthook が見つからないときは、コミットが止まります。そのときは、コミットするフォルダで `bun install` を動かします。
- `bun run dev` で開発用のサーバーを動かします。
- `bun run typecheck` で型を確かめます。
- `bun run lint` で ESLint を動かします。警告が1つでもあれば失敗します。
- `bun run format` で Oxfmt が整形します。`bun run format:check` は確かめるだけです。
- `bun run test` で Vitest のテストを動かします。
- `bun run build` で `dist/` にページを書き出し、最後に `scripts/verify-dist.ts` で書き出したものを確かめます。
- `bun run check` で、ファイルの種類、型、ESLint、整形、テスト、ビルドを順に確かめます。コミットの前には lefthook が、PR では CI が、これを動かします。
- `bun run check:release-age` で、`bun.lock` のすべての版が、公開から `bunfig.toml` の `minimumReleaseAge` 秒以上たっているかを確かめます。npm に問い合わせるので `bun run check` には入れず、CI が `bun install` の前に別に動かします。

## 守ること

- 機能のコードは `src/app/` に書きます。ここでは DOM の型がないので、`document`、`fetch`、`localStorage` のようなブラウザの仕組みは型のエラーになります（ADR 0007）。文章の入出力、コピー、乱数は `src/platform/` の部品を使います。
- ブラウザに触れるのは `src/platform/` と `src/shell/` だけです。使ってよい要素、属性、パッケージ、ブラウザの仕組みは `guards/zones.ts` に並べてあり、並べていないものは ESLint が止めます。新しく使いたいものは、`guards/zones.ts` に足して、人に確かめてもらいます。
- `globalThis`、`eval`、`Function`、`Reflect`、`import()` と、型をごまかす書き方（`x is T`、オーバーロード、`declare global`、`namespace`）は、`src/` で使えません。
- `any`、`!` による決めつけ、`as` による型の書き換えを使いません。型の絞り込みで合わせます。`text!: string` や `let target!: number` の `!`、`declare`、`// @ts-expect-error`、`// @ts-ignore`、`// @ts-nocheck`、`/// <reference>` も止まります。
- JavaScript のファイルと `.d.ts` を書きません。型のチェックと ESLint の守りが届かないためです。リポジトリのいちばん上には、名前を決めたファイルだけを置きます。ESLint や Vitest は設定のファイルを名前で探し、守りの設定より先に読むことがあるためです。`bun run check:files`（`guards/files.ts`）が、ほかのファイルを止めます。テストの中ではなく、`bun run check` の最初に動きます。
- `eslint-disable` のコメントは効きません。ルールに引っかかったら、コードを直します。
- 文章の入力欄のスペルチェックは切ったままにします。Chrome の強化スペルチェックは、入力した文字を Google に送ります（ADR 0007）。
- `vite.config.ts` を変えたら、`scripts/dist-policy.ts` の `referenceBuild` も同じに変えます。`bun run build` の最後に `scripts/verify-dist.ts` が、2つのビルドの `dist/` が同じか、ページに入ったものの出どころ、書き出した `index.html` と CSS を確かめます。
- `public/_headers` の CSP をゆるめません。`guards/config-policy.ts` が止めます。きびしくするのは自由です。
- `bunfig.toml` の `minimumReleaseAge` を下げません。新しすぎて入らない版は、古い版を選びます。`bun.lock` は npm のレジストリから入る版だけにします。`package.json` のスクリプト、lefthook、CI で動かせるコマンドは `guards/config-policy.ts` に並べたものだけで、`bunx` や `npx` は止まります。
- 守りを試すコードは `guard-probes/` に置きます。止まるはずのものは `blocked/` に置き、1行目に `// stopped-by: TS2304` のように、止めるものを書きます。
- `.github/guarded-paths` のファイルを変えた PR は、CI の「Guards」が失敗します。人が確かめてからマージします。
- ADR をコードに合わせて書き換えません。決めたことを変えるときは、新しい ADR を足します。
