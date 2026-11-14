---
name: verify-mojisashi
description: mojisashi のページを、書き出した dist/ と本番と同じ CSP の下で Playwright で動かし、機能が使う人に見えるとおりに動くかを確かめる。文字数を数える機能やページの約束（文章を送らない、残さない）を変えたあと、「ブラウザで確かめて」と頼まれたとき、PR の前の確認に使う。
---

# mojisashi をブラウザで確かめる

mojisashi は、サーバーで何もしない1ページのサイトです。使う人が触るのはブラウザのページだけです。このスキルは、`bun run build` で書き出した `dist/` を Playwright の Chromium で開き、使う人と同じ操作で機能を動かします。

ページは本物のサーバーから配りません。Playwright が `https://mojisashi.test/` への要求を受け取り、`dist/` のファイルを返します。そのとき `public/_headers` の CSP をそのまま付けます。CSP が本番と同じなので、CSP に止められるコードはここでも止まります。`https://mojisashi.test/` 以外への要求は、すべて止めて記録します。

## Launch

1. `bun install` で依存を入れます。クラウドのセッションで `DNSResolveFailed` が出たら、registry.npmjs.org がプロキシを通っていません。`NO_PROXY=localhost,127.0.0.1 no_proxy=localhost,127.0.0.1 bun install` で入れ直します。
2. `bun run build` でページを書き出します。最後に `dist/ の N 個のファイルは、決めた設定のビルドと一致します` と出たら、使える状態です。この行が出ずに失敗したら、確かめる前にビルドを直します。

サーバーは立てません。止めるものもありません。`dist/` はチェックアウトの中に書かれます。同じチェックアウトで2つの確認を同時に動かすと、ビルドが互いを書き換えます。同時に動かすときは、`git worktree add` で別のフォルダを作ります。

## Doctor

確かめる前と、結果がおかしいときに、次を動かします。どれも読むだけです。

```bash
test -f dist/index.html && echo "dist あり" || echo "dist なし: bun run build"
```

```bash
find src public scripts index.html vite.config.ts package.json bun.lock tsconfig*.json -newer dist/index.html | head
```

何か出たら、`dist/` がソースより古いので、`bun run build` をやり直します。

```bash
NODE_PATH=/opt/node-tools/node_modules node -e "require('playwright'); console.log('playwright あり')"
```

クラウドのコンテナでは、Playwright と Chromium は `/opt/node-tools/node_modules` に入っています。手元のパソコンでは、Playwright が入っている `node_modules` を `NODE_PATH` に指定します。`playwright install` は動かしません。

## Drive

スクラッチパッドを `$SCRATCH` とします。

1. 道具を取り出します。リポジトリには JavaScript のファイルを置けない（`guards/files.ts`）ので、道具は [driver.md](driver.md) のコードブロックにあります。

   ```bash
   awk '/^```js drive.mjs$/{f=1;next} /^```$/{f=0} f' .claude/skills/verify-mojisashi/driver.md > "$SCRATCH/drive.mjs"
   ```

2. 確かめる機能の手順を書きます。[features/](features/README.md) の機能ごとのファイルに、そのまま使える手順があります。

   ```bash
   awk '/^```js scenario$/{f=1;next} /^```$/{f=0} f' .claude/skills/verify-mojisashi/features/count.md > "$SCRATCH/count.mjs"
   ```

3. 動かします。引数は、リポジトリ、証拠を置くフォルダ、手順のファイルです。

   ```bash
   NODE_PATH=/opt/node-tools/node_modules node "$SCRATCH/drive.mjs" . "$SCRATCH/evidence/count" "$SCRATCH/count.mjs"
   ```

   手順の1つずつに `PASS` か `FAIL` が出ます。最後の行が `ALL PASS` なら、終了コードは0です。

手順のファイルは、`export default async function ({ page, open, storage, capture, step })` を書いた ES モジュールです。

- `page` は Playwright の `Page` です。ページはもう開いています。
- `open()` は、ページを開き直します。
- `storage()` は、cookie、`localStorage`、`sessionStorage`、IndexedDB に残っているものの数を返します。
- `capture(name)` は、スクリーンショットと ARIA のスナップショットを証拠のフォルダに書きます。
- `step(name, ok, detail)` は、確かめた結果を1つ記録します。

要素は、役割と見える名前で探します（`getByRole("textbox", { name: "文章" })`）。CSS のセレクターや並び順は使いません。

道具は、手順が終わったあとに、どの機能でも次の3つを確かめます。

- `https://mojisashi.test/` 以外への要求がない
- コンソールにエラーも警告もない。CSP の違反はここに出ます
- 捕まえていない例外がない

## Evidence

証拠は、Drive の3番目の引数のフォルダに残ります。

- `log.json` に、手順ごとの結果、止めた要求、コンソールのエラーが入ります。
- `<name>.png` と `<name>.aria.txt` は、`capture(name)` で書いた画面とアクセシビリティツリーです。

確かめるときの決まりは次のとおりです。

- 使う人の操作で動かします。React の state を直接書いたり、テスト用の入口を作ったりしません。
- 操作のあとの状態を確かめます。最後の画面だけでなく、途中の値も `step` で記録します。
- 見える結果だけでなく、残ってはいけないものも確かめます。文章が cookie や Web Storage や IndexedDB に残らないこと、再読み込みで文章が消えることは、`storage()` と `open()` で確かめます。
- 期待する値は、仕様（`docs/features/`）から手で数えて書きます。ページが出した値を写しません。

## Cleanup

道具は、自分で開いたブラウザを最後に閉じます。ほかに立てたものはありません。プロセスを名前で止めることはしません。証拠のフォルダは消しません。`dist/` は `.gitignore` に入っているので、残してかまいません。`git worktree add` で別のフォルダを作ったときは、`git worktree remove <フォルダ>` で片づけます。

## Helpers

- [driver.md](driver.md) の `drive.mjs` が、道具の本体です。取り出し方と動かし方は、上の Drive に書いたとおりです。
- [features/](features/README.md) に、機能ごとの手順があります。新しい機能を足したら、ここにもファイルを足します。
