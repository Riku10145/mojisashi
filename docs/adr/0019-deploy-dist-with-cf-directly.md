# dev環境には、cf で dist/ をそのまま公開する

ADR 0009 では、cf 1.0.0-beta.28 が `dist/` をそのまま公開できないため、`scripts/cloudflare-output.ts` が `dist/` から cf の Build Output を書き、`cf deploy --prebuilt` で公開すると決めました。cf の版を上げたら、このスクリプトを消すとも決めました。

cf を 1.0.0-beta.29 に上げ、`bun run deploy:dev` を `cf deploy dist --mode dev` にします。beta.29 の `cf deploy` は、静的なファイルだけのフォルダを受け取り、cf が自分で Build Output を書いて公開します。そこで、次のものを消します。

- `scripts/cloudflare-output.ts`
- `devDependencies` の `@cloudflare/build-output-utils` と `@cloudflare/config`。スクリプトだけが使っていました。
- 2つの版を cf の依存と同じにするテスト

2つのパッケージは、cf が依存する版と同じにしておく必要がありました。cf より数時間早く公開されるので、Dependabot が2つだけを上げると、テストが失敗しました（ADR 0012）。消したので、Dependabot は cf だけを上げます。

ADR 0009 のほかの決まりは変えません。Worker は静的なファイルだけを返し、Worker のコード、バインディング、`workers.dev`、プレビューの URL を持ちません。公開するのは、`bun run check` で確かめた `dist/` で、公開の前にビルドし直しません。`cf deploy dist --mode dev --dry-run` で、cf が書く Build Output が、Worker の名前 `mojisashi-dev`、ドメイン `dev.mojisashi.app`、`workersDev` と `previewUrls` が `false` の、静的なファイルだけのものになることを確かめました。

`guards/cloudflare-config.test.ts` は、`@cloudflare/config` で設定を読む代わりに、`cloudflare.config.ts` の関数を直接呼んで確かめます。`worker` のほかのキーがあると止まるので、コードやバインディングを足すと失敗します。

## Considered Options

- **`@cloudflare/config` だけを残し、テストで設定を読む。** cf が読むのと同じ形で確かめられます。ただ、cf の依存と同じ版にしておく必要が残り、Dependabot が上げると失敗します。
