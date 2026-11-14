# 依存は1つの版に決め、Dependabot で上げる

これまで `package.json` の依存は、`^19.3.1` や `~6.0.3` のような範囲で書いていました。入る版を決めているのは `bun.lock` で、`package.json` を読んでも、どの版が入っているかはわかりません。`bun.lock` なしで `bun install` を動かすと、範囲の中の新しい版が入ります。

そこで、`package.json` に書く直接の依存は、すべて1つの版に決めて書きます。`package.json` と `bun.lock` が同じ版を指すので、版を上げると、どちらにも差分が出ます。直接の依存が使う間接の依存は `package.json` に書かないので、その版を決めるのは、これまでどおり `bun.lock` です。

ADR 0003 のとおり、機械的に守ります。

- `bunfig.toml` の `exact = true` で、`bun add` が範囲ではなく1つの版を書きます。`exact = true` がないと、`guards/config-policy.ts` が止めます。
- `guards/config-policy.ts` は、`package.json` の版に `^` や `~` が付いていたら止めます。`.github/guards-unchanged.sh` も同じように止めます。cf だけはベータの版を書けます（ADR 0006）。

## Dependabot が PR を出し、人がマージする

版は Dependabot が上げます。設定は `.github/dependabot.yml` です。

- 月に1回、bun のパッケージを調べ、まとめて1つの PR を出します。cf はベータなので、別の PR にします。cf の版を上げる PR は、dev環境への公開で確かめます。
- 月に1回、GitHub Actions のアクションを調べ、まとめて1つの PR を出します。
- 公開から7日たっていない版は出しません（`cooldown` の `default-days: 7`）。`bunfig.toml` の `minimumReleaseAge` と同じ日数です。Dependabot は `bunfig.toml` を読まないので、同じ日数を2か所に書きます。`cooldown` が `minimumReleaseAge` より短いと、`guards/config-policy.test.ts` が止めます。

人は PR を確かめてマージします。Dependabot の PR のあとに、人が版やリストを書き直す手順はありません。

## 7日待つのは直接の依存だけ

`cooldown` が待つのは、`package.json` に書いた直接の依存だけです。Dependabot が取得するのは `package.json`、`bun.lock`、`.npmrc` だけで、`bunfig.toml` は読みません（dependabot-core の `bun/lib/dependabot/bun/file_fetcher.rb`）。そのため、Dependabot が作り直した `bun.lock` に、公開から7日たっていない間接の依存が入ることがあります。

そのときは、CI の `bun run check:release-age` が失敗します。これは守りが働いた結果です。その版が公開から7日たつのを待ってから、CI を動かし直します。`@dependabot recreate` は使いません。版を選び直すので、もっと新しい版が入ることがあります。

## メジャーバージョンで PR が失敗したら、そのパッケージを外す

まとめた PR には、メジャーバージョンを上げるパッケージも入ります。そのパッケージに互換性のない変更があると、まとめた PR 全体が CI で失敗します。そのときは、次の順に進めます。

1. まとめた PR に `@dependabot ignore <パッケージ> major version` とコメントします。そのパッケージのメジャーバージョンは、まとめた PR に入らなくなります。
2. そのパッケージは、別の PR で上げて、コードを直します。
3. 直した PR をマージしたら、`@dependabot unignore <パッケージ>` とコメントします。

## アクションは名前で決め、40桁のコミットで指す

ワークフローの `uses:` に書けるのは、`guards/config-policy.ts` の `actions` に並べた名前のアクションを、40桁のコミット（SHA）で指したものだけです。タグやブランチは、アクションの持ち主が指す先を動かせるので使えません。Dependabot がコミットを上げても名前は変わらないので、`actions` を書き直さずに済みます。

その代わり、ほかの人のコミットを止められなくなります。GitHub は、同じネットワークにあるフォークのコミットも、元のリポジトリの名前で取得します。名前とコミットの組を並べていたときは、このようなコミットも止まりました。名前だけでは止まりません。それでも、ワークフローを変える PR は CI の「Guards」が失敗するので、人が確かめてからマージします（ADR 0007）。Dependabot のアクションの PR も同じです。

## Dependabot が上げないもの

- ワークフローの `bun-version` と `node-version` は、Dependabot が上げません。一方、`@types/bun` は上げるので、型が CI の bun より新しくなることがあります。CI はワークフローに書いた版の bun でテストを動かすので、その bun にない API を使うコードは CI で失敗します。そのため、このままにします。
- bun のパッケージでは、Dependabot のセキュリティアップデートが使えません。セキュリティの修正が出ても、月に1回の PR を待つことになります。急ぐときは、人が版を上げる PR を作ります。リポジトリの設定で Dependabot alerts を有効にすれば、脆弱性が見つかったときに知らせが届きます。有効にするのは、リポジトリの持ち主です。

## cf の Build Output を書く2つのパッケージ

cf 1.0.0-beta.28 では、`scripts/cloudflare-output.ts` が `@cloudflare/build-output-utils` と `@cloudflare/config` で Build Output を書きます。この2つは、cf が依存する版と同じにしておきます。違う版にすると、`guards/cloudflare-config.test.ts` が止めます。

cf を 1.0.0-beta.29 以降に上げるときは、ADR 0009 のとおり `scripts/cloudflare-output.ts` を消し、2つのパッケージも消します。そのあとは、Dependabot が cf だけを別の PR で上げます。

## Considered Options

- **`^` の範囲のまま、`bun.lock` だけを新しくする。** `package.json` を変えずに済みます。ただ、範囲からは入っている版がわかりません。`bun.lock` なしの `bun install` で、確かめていない版が入ることもあります。
- **Renovate を使う。** 設定でできることが多いツールです。ただ、GitHub App を入れる必要があります。Dependabot は GitHub に最初から入っているので、Dependabot を選びました。
- **アクションを名前とコミットの組で並べる。** フォークのコミットも止められます。ただ、Dependabot がアクションを上げるたびに、人が `actions` を書き直すことになります。
- **2つのパッケージを Dependabot に上げさせず、人が cf に合わせる。** cf を上げるたびに、人が合わせる必要があり、忘れるおそれがあります。2つは cf を上げるときに消すので、合わせ続ける手順は作りませんでした。
