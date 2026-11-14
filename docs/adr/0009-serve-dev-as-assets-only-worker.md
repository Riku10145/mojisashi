# dev環境は、静的なファイルだけを返す Worker にする

ADR 0006 では `main` を cf で dev環境（`dev.mojisashi.app`）に公開し、dev環境の応答に `X-Robots-Tag: noindex` を付けると決めました。その Worker の形を、次のように決めます。

- **Worker は静的なファイルだけを返します。** Worker のコード（`entrypoint`）も、`run_worker_first` も使いません。Cloudflare は `_headers` のヘッダーを静的なファイルの応答にだけ付け、Worker のコードが返した応答には付けません。`_headers` の CSP は文章を送らないという約束（ADR 0001、0007）を守るためのものです。CSP の付かない応答を作らないために、Worker のコードを持ちません。
- **noindex は `_headers` にホスト名のルール（`https://dev.mojisashi.app/*`）で書きます。** 本番と dev環境は同じ `dist/` を公開し、noindex は dev環境のホスト名へのリクエストにだけ付きます。
- **Workers Caching は使いません。** 有効にすると、静的なファイルへのリクエストも課金の対象になり、ADR 0004 で Cloudflare を選んだ理由がなくなります。
- **`workers.dev` とプレビューの URL は使いません。** dev環境は Custom Domain の `dev.mojisashi.app` だけで返します。ほかのホスト名には noindex のルールがないので、本番と同じ内容のページが検索に載るおそれがあります。
- **環境は `cloudflare.config.ts` の表に1行ずつ書きます。** `cf deploy --mode dev` が dev の行を選びます。本番を公開するときは、表に本番の行を足します。
- **公開するのは `bun run check` で確かめた `dist/` です。** cf 1.0.0-beta.28 は `dist/` をそのまま公開できず、cf の Build Output（`.cloudflare/output/`）だけを公開します。そこで `scripts/cloudflare-output.ts` が `dist/` から Build Output を書き、`cf deploy --prebuilt` がそれを公開します。1.0.0-beta.29 からは `cf deploy dist` で同じことができるので、cf の版を上げたら、このスクリプトを消します。

`guards/cloudflare-config.test.ts` は、どの環境の Worker もコード、バインディング、キャッシュ、`workers.dev`、プレビューの URL を持たないことと、本番のほかのドメインに noindex のルールがあることを確かめます。GitHub Actions のワークフローで設定できる環境変数は、Cloudflare に公開するための `CLOUDFLARE_API_TOKEN` と `CLOUDFLARE_ACCOUNT_ID` と、`DO_NOT_TRACK: "1"` だけです（`guards/config-policy.ts`）。`DO_NOT_TRACK` は、cf が使い方の情報を Cloudflare に送らないようにします。cf はこの変数を、ほかのテレメトリーの設定より先に見ます。
