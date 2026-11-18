# ハッシュの入った JS と CSS を、ブラウザに1年残させる

dev環境の `/assets/index-<ハッシュ>.js` は、`cache-control: public, max-age=0, must-revalidate` を返します。Cloudflare が静的なファイルに付ける既定の値です。この値だと、ブラウザは2回目に開いたときも、JS と CSS のそれぞれについて、変わっていないかを Cloudflare に問い合わせます。中身は変わっていないので、問い合わせはむだになり、ページが使えるようになるまでが遅れます。

そこで `public/_headers` で、`/assets/*` に `Cache-Control: public, max-age=31536000, immutable` を付けます。ブラウザは1年のあいだ、問い合わせずにそのまま使います。

## 長く残させても困らない理由

`dist/assets/` のファイルは、どれも Vite のビルドが書き出したもので、名前に中身のハッシュが入っています（`index-DVA07QTa.js` のように）。中身が変われば名前も変わるので、古いファイルが残っていても、新しいページがそれを読むことはありません。

ほかのファイルが `dist/assets/` に入ることもありません。`dist/` のファイルは、ビルドが書き出すものと `public/` のファイルだけです。`guards/files.ts` は、`public/` に名前を決めたファイルしか置かせず、フォルダの中にも置かせません（ADR 0015）。そのため `public/assets/` は作れません。

それでも、ビルドの設定を変えると、ハッシュのない名前で書き出せます。そこで、`scripts/verify-dist.ts` が `dist/assets/` のファイルの名前を確かめ、中身のハッシュがない名前があればビルドを止めます。

HTML を返す `/` は、これまでどおり `max-age=0, must-revalidate` です。HTML の名前にはハッシュがないので、公開した新しいページを、次に開いたときにすぐ届けるためです。HTML が新しくなれば、新しい名前の JS と CSS を読みます。

## `no-transform` は付けない

`/assets/*` には `no-transform` を付けません。ADR 0010 のとおり、`no-transform` があると Cloudflare は圧縮もしなくなります。Cloudflare がスクリプトを書き足すのは HTML だけなので、JS と CSS に付ける理由はありません。

## ADR 0010 から変わること

ADR 0010 は、`guards/cloudflare-config.test.ts` が `Cache-Control` のルールを `/` の1つだけと確かめる、と決めました。これを、`/` と `/assets/*` の2つのルールを確かめる、に変えます。`/` のルールの値は変えません。ADR 0010 のほかの決まりも変えません。

`verify-mojisashi` の道具は、`_headers` のルールをパスごとに当てるので、手を入れなくても `/assets/` のファイルにこのルールを付けます。

## リポジトリの外で確かめること

`main` にマージして dev環境に公開したら、`/assets/` の JS と CSS が `cache-control: public, max-age=31536000, immutable` を返し、`content-encoding` で圧縮されていることを確かめます。`/` が `no-transform` の付いた値を返すことも、あわせて確かめます。

## Considered Options

- **既定の値のままにする。** 設定は増えません。ただ、開くたびに JS と CSS の問い合わせが残ります。
- **`max-age` を1日のように短くする。** 名前が変われば新しいファイルを読むので、短くしても安全さは変わりません。期限が切れるたびに問い合わせが戻るだけです。
- **Cloudflare のダッシュボードで、ブラウザのキャッシュの期間を決める。** リポジトリからは見えず、`_headers` と違ってテストで確かめられません。ADR 0010 と同じく、ダッシュボードの設定には頼りません。
- **`no-transform` も付ける。** HTML と同じ値の形にそろいます。ただ、JS が圧縮されずに届くので、選びませんでした。
