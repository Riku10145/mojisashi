# mojisashi

## 先に読むもの

- `README.md` に、何を作るかと、使う人への約束を書いています。
- `GLOSSARY.md` は用語集です。コード、画面の文言、コミットでもここの言葉を使います。
- `docs/adr/` に、決めたことと理由を書いています。
- `docs/features/` に、機能ごとの使い方を書いています。

## コマンド

- `bun install` で依存を入れます。lefthook のコミット前チェックも入ります。
- `bun run dev` で開発用のサーバーを動かします。
- `bun run typecheck` で型を確かめます。
- `bun run lint` で ESLint を動かします。警告が1つでもあれば失敗します。
- `bun run format` で Oxfmt が整形します。`bun run format:check` は確かめるだけです。
- `bun run test` で Vitest のテストを動かします。
- `bun run build` で `dist/` にページを書き出します。
- `bun run check` で、型、ESLint、整形、テスト、ビルドを順に確かめます。コミットの前には lefthook が、PR では CI が、これを動かします。

## 守ること

- 通信の仕組みを使いません。`fetch`、`XMLHttpRequest`、`WebSocket`、`EventSource`、`WebTransport`、`RTCPeerConnection`、`RTCDataChannel`、`sendBeacon` が該当します（ADR 0001）。どのオブジェクトから取り出しても止まります。
- ブラウザの中に文章を残す仕組みも使いません。`localStorage`、`sessionStorage`、`indexedDB`、`caches`、`cookieStore`、`cookie` が該当します（ADR 0001）。こちらも、どのオブジェクトから取り出しても止まります。
- ページの移動とワーカーも使いません。文章を外に運んだり、残したりできるためです（ADR 0001）。`Worker`、`SharedWorker`、`BroadcastChannel`、`serviceWorker`、`open`、`location`、`navigation`、`setAttribute`、`setAttributeNS` が該当し、どのオブジェクトから取り出しても止まります。`href` と `xlinkHref` は、JSX に文字列をそのまま書くときだけ使えます。
- `window`、`self`、`globalThis`、`top`、`parent`、`frames` と、`defaultView`、`contentWindow`、`opener`、`postMessage` も使いません。別のウィンドウや window を通すと、ほかの守りを回り込めるためです（ADR 0001）。
- `any`、`!` による決めつけ、`as` による型の書き換えを使いません。型の絞り込みで合わせます。
- JavaScript のファイル（`.js`、`.jsx`、`.mjs`、`.cjs`）を書きません。型のチェックと ESLint の守りが届かないためです。TypeScript で書きます。
- `eslint-disable` のコメントは効きません。ルールに引っかかったら、コードを直します。
- インラインの `style`、`<script>`、`dangerouslySetInnerHTML` を書きません。見た目は Tailwind のクラスで書きます。
- `public/_headers` の CSP をゆるめません。
- `bunfig.toml` の `minimumReleaseAge` を下げません。新しすぎて入らない版は、古い版を選びます。
- ADR をコードに合わせて書き換えません。決めたことを変えるときは、新しい ADR を足します。
