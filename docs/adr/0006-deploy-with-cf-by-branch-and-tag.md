# cf で公開し、main は dev、release のタグは本番へ

公開には、Cloudflare の新しいCLIの cf を使います。cf は2026年9月に公開されたばかりのオープンベータで、コマンドや設定の形が変わることがあります。それでも、wrangler の後を継ぐ道具で、設定を TypeScript（`cloudflare.config.ts`）で書けて型で守れるため、wrangler ではなく cf を選びました。ベータの間は版を1つに固定し、版を上げるときは dev環境への公開で確かめます。

公開の流れは次のとおりです。

- `main` にマージすると、GitHub Actions が dev環境（`dev.mojisashi.app`）に公開します。dev環境の応答には `X-Robots-Tag: noindex` を付け、検索に載らないようにします。本番と同じ内容のページが検索に載ると、本番の検索順位に悪い影響が出るおそれがあるためです。
- `main` から `release` ブランチへのPRをマージし、`release` 上のコミットに `v1.2.3` の形のタグを付けて push すると、本番（`mojisashi.app`）に公開します。公開のきっかけはマージではなくタグの push です。タグを付け忘れたまま本番に出ないようにするためです。GitHub Actions は、タグの形と、タグのコミットが `release` にあることを確かめ、どちらかが違えば止めます。
- GitHub の Environments に `dev` と `prod` を分け、Cloudflare に公開するための鍵もそれぞれに置きます。`prod` は `v` で始まるタグからしか使えません。
