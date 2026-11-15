# AI のクローラには、検索と回答のための取得を許し、学習は許さない

dev環境の `/robots.txt` は `200` を返しますが、中身は Cloudflare の「content signals」を説明するコメントだけです。`User-agent` の行も `Sitemap` の行もありません。リポジトリの `public/` に `robots.txt` はなく、このファイルは Cloudflare が作っています。

Cloudflare が作る中身は、ダッシュボードの設定で変わります。AI のクローラを止める行が足されても、リポジトリからは分かりません。ChatGPT の検索や Perplexity の回答に mojisashi が出るかどうかが、コードの外で決まってしまいます。

そこで、`public/robots.txt` と `public/sitemap.xml` を自分で置き、AI のクローラの扱いをここで決めます。

## 決めたこと

- **すべてのクローラに、ページを読むことを許します。** 検索エンジンも AI のクローラも同じです。クローラが読めるのは、書き出した HTML にあるページの説明だけです。使う人の文章はブラウザの外に出ないので（ADR 0001）、クローラに渡る文章はありません。
- **Content-Signal で、検索（`search`）と AI の回答（`ai-input`）を許し、学習（`ai-train`）は許しません。** mojisashi を知ってもらうには、検索の結果と AI の回答に出ることが要ります。学習を許しても、使う人に増えるものはありません。あとから許すのは1行で済みますが、学習に使われたものは取り消せません。そこで、まず許さない側にしておきます。
- **`Sitemap:` の行で、`https://mojisashi.app/sitemap.xml` を伝えます。** ページは1つなので、`sitemap.xml` には手で書いた URL が1つだけ入ります。
- **dev環境でも同じ `robots.txt` を返します。** dev環境と本番は同じ `dist/` を公開するためです（ADR 0009）。dev環境で `Disallow: /` にすると、クローラが `X-Robots-Tag: noindex` を読めなくなり、かえって URL だけが検索に出ることがあります。dev環境を検索から外すのは、これまでどおり `noindex` の役目です。

Content-Signal は Cloudflare が提案している書き方で、すべてのクローラが守るとは限りません。止める仕組みではなく、mojisashi の考えを示すものです。

## リポジトリの外で確かめること

本番を公開するとき（#16）に、Cloudflare のダッシュボードで次を確かめます。

- managed robots.txt が有効だと、Cloudflare は自分の行を `public/robots.txt` の前に足します。切るか、この ADR と同じ中身になるようにします。
- 「AI ボットをブロック」（AI Crawl Control）と Bot Fight Mode が、AI のクローラを止めていないこと。

## Considered Options

- **Cloudflare の managed robots.txt に任せる。** 置くファイルが1つ減ります。ただ、中身がダッシュボードで変わり、リポジトリでは確かめられません。
- **学習も許す（`ai-train=yes`）。** AI のモデルが mojisashi を覚えやすくなるかもしれません。ただ、検索と回答のための取得を許せば、回答に出る道は開いています。学習を許すかは、持ち主があとで決め直せるように、まず許さない側にしました。
- **AI のクローラを `Disallow` で止める。** AI の回答に出なくなり、mojisashi を知ってもらう道が1つ減るので、選びませんでした。
