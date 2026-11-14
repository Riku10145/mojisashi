# HTML だけ Cloudflare に書き換えさせない

Cloudflare の無料プランでは、RUM（Real User Monitoring）が最初から有効です。RUM が有効だと、Cloudflare は配る途中の HTML に計測のスクリプト（`static.cloudflareinsights.com`）を書き足します。dev環境でもブラウザで開いた HTML にこのスクリプトが入っていました。

スクリプトは CSP（`script-src 'self'`）が止めるので動かず、文章も送られません。それでも、次の理由で書き足させないことにします。

- 使う人に届く HTML が、`scripts/verify-dist.ts` で確かめた HTML と違うものになります。
- ページを開くたびに、コンソールに CSP の違反が出ます。本当の不具合による違反と見分けにくくなります。
- RUM を切る設定はダッシュボードで見つかりませんでした。画面の設定は変わることがあるので、設定には頼りません。

そこで `public/_headers` で、HTML を返す `/` にだけ `Cache-Control: public, max-age=0, must-revalidate, no-transform` を付けます。`no-transform` があると、Cloudflare は中身を書き換えません。`no-transform` のほかの値は、Cloudflare が静的なファイルに付ける既定の値と同じです。

このルール1つで足りるのは、HTML を返す URL が `/` だけだからです。ADR 0005 のとおりページは1つで、`/index.html` と `/index` は `/` へ転送されます。ページを足すときは、その URL にも `no-transform` を付けます。

JS と CSS には `no-transform` を付けません。`no-transform` があると Cloudflare は圧縮もしなくなり、JS は gzip で約70KBになるところを、約223KBのまま届けることになります。スクリプトが書き足されるのは HTML だけなので、HTML にだけ付ければ足ります。HTML は3KBに満たないので、圧縮されなくても困りません。

RUM を動かすために CSP をゆるめることはしません。ページの中で動く外のスクリプトは、入力欄の文章を読めるためです（ADR 0001、0007）。

`guards/cloudflare-config.test.ts` は `Cache-Control` のルールが `/` の1つだけであることを確かめます。`verify-mojisashi` の道具も `_headers` のルールをパスごとに当てるので、本番と同じく HTML にだけ `no-transform` を付けます。
