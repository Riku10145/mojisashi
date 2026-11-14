# テスト用の文章を作る

決めた文字数ちょうどの、小文字の英字をランダムに並べたテスト用の文章を作り、コピーできるようにします。仕様は `docs/features/generate/README.md` にあります。

## Sub-features

- `generate-length` は、入れた文字数ちょうどの文章を作る。
- `generate-letters` は、aからzの小文字だけを使う。
- `generate-limit` は、100,000文字まで作れる。
- `generate-copy` は、作った文章をコピーする。

## How to get to it (user POV)

- まだページにありません。作ったら、この欄に入口を書きます。

## Driving it with drive.mjs

Preconditions:

- この機能がページにある。いまはないので、この手順は失敗として報告します。

まだ手順はありません。機能を作ったら、`count.md` と同じ形で、操作、確かめること、`js scenario` のコードブロックを書きます。

## Gotchas

- コピーは `navigator.clipboard.writeText` を使います。ヘッドレスの Chromium でクリップボードを読むには、`context.grantPermissions(["clipboard-read", "clipboard-write"])` が要ります。道具を直してから手順を書きます。
