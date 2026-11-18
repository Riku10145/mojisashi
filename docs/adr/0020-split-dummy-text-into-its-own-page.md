# 「テスト用の文章を作る」を `/dummy-text/` のページに分ける

「文字数を数える」と「テスト用の文章を作る」を、別のページにします。数えるページは `/`、作るページは `/dummy-text/` です（#42）。ADR 0005 では1ページと決め、ページを増やすときはこの判断を見直すと書いていました。この ADR で見直します。

検索エンジンはふつう1つのページを1つの検索の目的に合わせて評価します。文字数を数えたい人と、決めた文字数の文章を作りたい人は、探す言葉も、ページを開いて最初にしたいことも違います。1ページに2つあると、`<title>` と説明の文がどちらか一方に寄ります。

## Search Console を見る前に決めた理由

#42 には本番を公開したあと、Search Console で検索された言葉を見てから決めても遅くないと書いていました。それでも、公開の前に分けます。

- URL は検索に載ったあとで変えると、転送を置き、評価が移るのを待つことになります。まだ本番を公開していない今なら、どちらも要りません。
- `<title>` と meta description はあとからいつでも変えられます。検索された言葉を見て直すのは、こちらにします。
- 「ダミーテキスト 文字数指定」「ダミーテキスト 日本語」は、確かめていない候補のままです。本番を公開したあと、Search Console で確かめます。

## 決めたこと

- **URL は `/dummy-text/` です。** 末尾に `/` を付けます。Cloudflare の静的なファイルの扱い（既定の `html_handling`）は、`dummy-text/index.html` を `/dummy-text/` で返し、`/dummy-text` と `/dummy-text/index.html` を `/dummy-text/` へ転送します。`/index.html` が `/` へ転送されるのと同じです。canonical、`og:url`、`sitemap.xml`、`llms.txt`、ページの間のリンクは、どれも `/dummy-text/` と書きます。
- **ルーターは使いません。** ページごとに HTML のテンプレート（`index.html`、`dummy-text/index.html`）を置き、Vite の複数ページのビルドで書き出します。ページの一覧は `scripts/pages.ts` の1か所に置き、`vite.config.ts`、`referenceBuild`、`scripts/prerender.ts`、`scripts/verify-dist.ts` がそれを読みます。
- **JS は1つのままです。** 2つのテンプレートは同じ `src/shell/entry-client.tsx` を読み込みます。そのため、ビルドが書き出す JS と CSS は1つずつで、`<link rel="modulepreload">` も増えません。`entry-client.tsx` は `location.pathname` を見て、どちらのページを動かすかを決めます。
- **shell のゾーンで `location.pathname` を読めるようにします。** ADR 0013 のとおり、機能に要るのでゆるめます。パスを読んでも、どこにも何も送らず、文章にも触れません。`guards/zones.ts` で shell に `location` と `Location.pathname` を足し、app のゾーンは変えません。
- **新しいページも `/` と同じ確かめを通します。** `scripts/verify-dist.ts` は `scripts/pages.ts` のページごとに、head と body のタグ、canonical、リンクのプレビュー、JSON-LD を確かめます。
- **HTML を返す URL にはどれも `no-transform` を付けます（ADR 0010）。** `public/_headers` に `/dummy-text/` のルールを足します。`guards/cloudflare-config.test.ts` は `Cache-Control` の `no-transform` のルールが `scripts/pages.ts` のパスと同じであることを確かめます。
- **canonical と `og:url` はページごとに自分の URL を書きます（ADR 0015 の見直し）。** ADR 0015 では `https://mojisashi.app/` だけを許していました。これを `scripts/pages.ts` のページの URL のどれかに広げます。そのうえで `canonicalProblems` が、ページがほかのページの URL を書いていないかを確かめます。
- **`llms.txt` のリンクはどれかのページを指します。** リンクの行の文はリンク先のページの本文にある文にします。

## 画面の言葉

用語集（`GLOSSARY.md`）では、「ダミーテキスト」は避ける言葉です。画面の見出しと文は「テスト用の文章」のままにします。「ダミーテキスト」は検索エンジンとリンクのプレビューが読む `<title>` と meta description（それを写す `og:*` と `twitter:*`）と、URL のパスにだけ使います。

## トップのページ

トップからは作る機能と、作ることについてのよくある質問を外します。meta description と説明の文からも「文章を作る」を外します。代わりに、説明の文の中に `/dummy-text/` へのリンクを置きます。作るページからも説明の文の中のリンクで `/` へ戻れます。

リンクのプレビューの画像は2つのページで同じ `og.png` を使います。画像には「文字数カウント」と書いてあるので、`og:image:alt` もそのままです。作るページの画像を別に作るには、`public/` に置けるファイルと `og:image` の値を広げる必要があります。これは別の issue で決めます。

## Considered Options

- **ページごとに別の入口（`entry-client.tsx`）を置く。** `location` を読まずに済みます。ただ、2つの入口が共通の部品を読み込むので、Vite は共通のチャンクを分け、HTML に `<link rel="modulepreload">` を足します。head に許すタグが増え、JS の読み込みも1段増えます。
- **`#root` の `id` をページごとに変え、`entry-client.tsx` がどの `id` があるかで決める。** shell のゾーンをゆるめずに済みます。ただ、ページを見分ける名前がパスと `id` の2つになります。`scripts/pages.ts`、`_headers`、canonical はパスで見分けるので、パスにそろえます。
- **React Router や TanStack Start を使う。** ページが2つなら、ルーターの設定や依存を増やす理由はまだありません。
- **1ページのままにする。** 検索の目的が違う2つの機能が、1つの `<title>` と説明を分け合うことになります。
