# 検索とリンクのプレビューのためのタグとファイルを、決めた形でだけ許す

検索エンジンや AI に、どの URL が正しいページか、何をする道具かを伝えるには、head のタグと、サイトのいちばん上に置くファイルを使います。SNS やチャットで URL を貼ったときのプレビューも、head のタグから作られます。

ところが `scripts/dist-policy.ts` の `headTags` は、書き出した `index.html` の head に入れてよいタグを6つだけに決めています。`guards/files.ts` は、`public/` の下に `.txt`、`.xml`、`.png` のファイルを置けません。そのため、canonical も OGP も構造化データ（JSON-LD）も `robots.txt` も、足すとチェックが止めます。

ADR 0013 のとおり、守りは機能に要るときだけゆるめます。この ADR に、何を、なぜ、どの形でだけ許すかを書きます。タグとファイルの中身を実際に足すのは、別の issue です。

## 許すもの

head に入れてよいタグに、次のものを足します。

- **`<link rel="canonical">`。** `href` は `https://mojisashi.app/` だけです。
- **OGP の `<meta property="og:*">`。** `og:title`、`og:description`、`og:type`、`og:site_name`、`og:locale`、`og:image:alt` は、`"`、`<`、`>` を含まない文字列を書けます。`og:url` は `https://mojisashi.app/` だけ、`og:image` は `https://mojisashi.app/og.png` だけ、`og:image:width` と `og:image:height` は数字だけです。
- **X のカードの `<meta name="twitter:*">`。** `twitter:card`、`twitter:title`、`twitter:description`、`twitter:image:alt` は文字列を書けます。`twitter:image` は `https://mojisashi.app/og.png` だけです。
- **構造化データの `<script type="application/ld+json">`。** 属性は `type` だけで、中身は `<` を含まず、`JSON.parse` で JSON のオブジェクトとして読めるものに限ります。

`public/` に置けるファイルは、`_headers`、`robots.txt`、`sitemap.xml`、`llms.txt`、`og.png` の5つだけにします。フォルダの中にも置けません。これまでは、どのフォルダにも置ける `.html` や `.json` などの種類も、`public/` に置けました。`public/` のファイルはそのまま公開されますが、`scripts/verify-dist.ts` が中身を確かめるのは、`index.html` と CSS だけです。そこで、名前を決めたファイルのほかは置けないように、守りをきびしくします。

## ゆるめても約束を守れる理由

どれも、ブラウザからのリクエストを生まず、文章（入力欄の中身）に触れません。

- **canonical と OGP のタグは、ブラウザが読み込みません。** 読むのは検索エンジンや、X、Slack のようなサービスのサーバーです。`og:image` の画像も、それらのサーバーが取りに来るもので、ページの中で表示するものではありません。CSP の `img-src 'none'` は、そのままにします。
- **JSON-LD は、ブラウザが実行しないデータです。** CSP の `script-src 'self'` と Trusted Types は、そのままで足ります。中身に `<` を許さないのは、`</script>` があるとそこでブロックが終わり、続きが HTML として読まれるためです。`<!--` も、ブラウザがブロックの終わりを探すやり方を変えます。JSON-LD の中で `<` が要るときは、`\u003c` と書けます。JSON として読めることを確かめるのは、データのふりをした別のものを入れさせないためです。
- **`public/` の4つのファイルは、ページが読み込みません。** ほかの静的なファイルと同じく、`public/_headers` の CSP の下で返します。
- **URL を本番の1つに決めます。** 本番と dev環境は同じ `dist/` を公開します（ADR 0009）。dev環境の URL を canonical や `og:url` に書くと、dev環境を正しいページだと伝えてしまいます。dev環境は `X-Robots-Tag: noindex` で検索に出ないので、両方に本番の URL を書いて困りません。JSON-LD の中の URL は確かめません。ブラウザは JSON-LD の中の URL を読み込まないためです。

## 確かめ方

- `scripts/dist-policy.ts` の `htmlProblems` は、head を前から順に、JSON-LD のブロックとタグに切り分けます。JSON-LD のブロックは中身が JSON のオブジェクトかを、タグは一覧に合うかを確かめます。決めた形でない JSON-LD（`src` 付き、ほかの属性付き、中身に `<` があるもの）はブロックとして切り出されず、開きタグが一覧にないタグとして止まります。ほかのタグの中や `<title>` の中に置いた JSON-LD も、外側のタグごと止まります。
- `guard-probes/build/head/` の HTML は、`index.html` の代わりです。決めた設定でビルドし、書き出した HTML を `htmlProblems` で確かめます。`allowed/` のものは通り、`blocked/` のものは止まることを、`scripts/dist-policy.test.ts` が確かめます。
- `public/` のファイル名は、`guards/files.ts` と `guards/files.test.ts` が確かめます。

## Considered Options

- **`og:*` と `twitter:*` を、名前を決めずにすべて許す。** 書くのは楽になります。ただ、`og:video` や `og:audio` のように、URL を書くタグも入れられます。いま要る名前だけを並べ、URL を書くものは値も決めます。
- **JSON-LD を、React で body に書き出す。** body の一覧に `<script>` を足すことになります。body は機能のコードから作られるので、head に固定の中身で置くよりも、確かめることが増えます。
- **JSON-LD を許さない。** canonical と OGP だけでも、どの URL が正しいかは伝わります。ただ、何をする道具かを検索エンジンや AI に伝えるには、構造化データが要ります。中身が JSON であることは、機械的に確かめられます。
