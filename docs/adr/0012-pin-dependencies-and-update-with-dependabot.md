# 依存は1つの版に決め、Dependabot で上げる

これまで `package.json` の依存は、`^19.3.1` や `~6.0.3` のような範囲で書いていました。入る版を決めているのは `bun.lock` で、`package.json` を読んでも、どの版が入っているかはわかりません。`bun.lock` なしで `bun install` を動かすと、範囲の中の新しい版が入ります。

そこで、依存はすべて1つの版に決めて書きます。`package.json` と `bun.lock` が同じ版を指すので、版を上げると、どちらにも差分が出ます。

ADR 0003 のとおり、機械的に守ります。

- `bunfig.toml` の `exact = true` で、`bun add` が範囲ではなく1つの版を書きます。
- `guards/config-policy.ts` は、`package.json` の版に `^` や `~` が付いていたら止めます。`.github/guards-unchanged.sh` も同じように止めます。cf だけはベータの版を書けます（ADR 0006）。

版は Dependabot が上げます。設定は `.github/dependabot.yml` です。

- 月に1回、bun のパッケージと GitHub Actions を調べ、それぞれ1つの PR にまとめて出します。
- cf と、Build Output を書く `@cloudflare/build-output-utils` と `@cloudflare/config` は、別の PR にします。cf の版を上げるときは dev環境への公開で確かめ、1.0.0-beta.29 以降に上げるときは `scripts/cloudflare-output.ts` を消します（ADR 0009）。2つのパッケージは、cf が使う版と同じにしておく決まりなので、cf と一緒に上げます。
- 公開から7日たっていない版は出しません（`cooldown` の `default-days: 7`）。`bunfig.toml` の `minimumReleaseAge` と同じ日数です。7日たっていない版は CI の `bun run check:release-age` で止まるので、2つは同じにしておきます。

まとめた PR には、メジャーバージョンを上げるパッケージも入ります。そのパッケージに互換性のない変更があると、まとめた PR 全体が CI で失敗します。そのときは、そのパッケージをまとめた PR から外し、別の PR で直します。

Dependabot には、人が確かめないと進まないところがあります。

- bun のパッケージでは、Dependabot のセキュリティアップデートが使えません。セキュリティの修正が出ても、月に1回の PR を待つことになります。急ぐときは、人が版を上げる PR を作ります。リポジトリの設定で Dependabot alerts を有効にすれば、脆弱性が見つかったときに知らせが届きます。有効にするのは、リポジトリの持ち主です。
- GitHub Actions の PR は `.github/workflows/` を変えるので、CI の「Guards」が失敗します（ADR 0007）。また、`guards/config-policy.ts` の `actions` に新しいコミットを足すまで、`bun run check` も失敗します。人がアクションの変更を確かめてから、`actions` を書き換えてマージします。

## Considered Options

- **`^` の範囲のまま、`bun.lock` だけを新しくする。** `package.json` を変えずに済みます。ただ、範囲からは入っている版がわかりません。`bun.lock` なしの `bun install` で、確かめていない版が入ることもあります。
- **Renovate を使う。** 設定でできることが多いツールです。ただ、GitHub App を入れる必要があります。Dependabot は GitHub に最初から入っているので、Dependabot を選びました。
