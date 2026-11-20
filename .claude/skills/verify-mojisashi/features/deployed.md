# 公開した環境

ほかの手順は、書き出した `dist/` を、`drive.mjs` が本番と同じ CSP を付けて返します。この手順は、Cloudflare が実際に返すものを確かめます。転送、`_headers` のヘッダー、HTML が書き換えられていないこと（ADR 0010）は、Cloudflare を通さないと確かめられません。ふだんは dev環境（`https://dev.mojisashi.app`）に向けて動かします。dev環境には、`main` に push したときの `dist/` が公開されます（ADR 0009）。

## Sub-features

- `deployed-pages` は、`public/sitemap.xml` に並べたページが、どれも 200 で HTML を返す。
- `deployed-headers` は、どのページにも `public/_headers` と同じ CSP と、`no-transform` の付いた `Cache-Control` を付ける。dev環境では `X-Robots-Tag: noindex` も付ける。
- `deployed-redirects` は、`/index.html` を `/` へ、`/dummy-text` と `/dummy-text/index.html` を `/dummy-text/` へ、307 で転送する。
- `deployed-untouched` は、HTML に Cloudflare の計測のスクリプト（`cloudflareinsights`）が入っていない。
- `deployed-canonical` は、どのページも canonical に自分の本番の URL を書いている。
- `deployed-assets` は、ページが読み込む `/assets/` の JS に、1年残してよい `Cache-Control` を付ける（ADR 0019）。
- `deployed-text` は、`public/` の `.txt`（`llms.txt` など）を、`Content-Type: text/plain; charset=utf-8` で返す。`charset` がないと、ブラウザは日本語を windows-1252 として読み、文字化けする。

## How to get to it (user POV)

- ブラウザで `https://dev.mojisashi.app/` か `https://dev.mojisashi.app/dummy-text/` を開く。
- 末尾の `/` を付けずに `https://dev.mojisashi.app/dummy-text` を開く。
- 古いリンクの `https://dev.mojisashi.app/index.html` を開く。

## Driving it with deployed.sh

Preconditions:

- コンテナのネットワークが `dev.mojisashi.app` を許している。許していないと、curl が `CONNECT tunnel failed, response 403` で止まります。
- 確かめたい変更が `main` に入り、GitHub Actions の `deploy-dev` が終わっている。PR のブランチは dev環境に公開されません。

道具はこのファイルの `bash deployed.sh` のブロックにあります。引数は、リポジトリ、証拠を置くフォルダ、確かめる環境の URL です。ページの一覧は、`public/sitemap.xml` から読みます。`guards/crawlers.test.ts` が、sitemap と `scripts/pages.ts` のページが同じことを確かめています。

```bash
awk '/^```bash deployed.sh$/{f=1;next} /^```$/{f=0} f' .claude/skills/verify-mojisashi/features/deployed.md > "$SCRATCH/deployed.sh"
bash "$SCRATCH/deployed.sh" . "$SCRATCH/evidence/deployed" https://dev.mojisashi.app
```

確かめたことの1つずつに `PASS` か `FAIL` が出ます。最後の行が `ALL PASS` なら、終了コードは0です。証拠のフォルダには、URL ごとのヘッダー（`*.headers.txt`）と HTML（`*.html`）が残ります。

```bash deployed.sh
#!/usr/bin/env bash
set -u
repo=$1 evidence=$2 base=${3%/}
mkdir -p "$evidence"
failed=0
step() { if [ "$2" = ok ]; then echo "PASS $1"; else echo "FAIL $1  ($3)"; failed=$((failed + 1)); fi; }
check() { if eval "$2"; then step "$1" ok; else step "$1" ng "$3"; fi; }
name_of() { local n=${1//\//_}; echo "${n:-_}"; }
fetch() {
  local name; name=$(name_of "$1")
  curl -sS --max-time 20 -D "$evidence/$name.headers.txt" -o "$evidence/$name.html" "$base$1" 2>"$evidence/$name.error.txt"
  echo "$evidence/$name"
}
# Through the session's proxy, curl writes the proxy's own "200 Connection Established" first, so
# only the last response counts.
response() { awk '/^HTTP\//{n=""} {n=n $0 "\n"} END{printf "%s", n}' "$1.headers.txt" | tr -d '\r'; }
header() { response "$1" | grep -i "^$2:" | head -1 | sed 's/^[^:]*: *//'; }
status() { response "$1" | head -1 | awk '{print $2}'; }

csp=$(grep -m1 'Content-Security-Policy:' "$repo/public/_headers" | sed 's/^ *Content-Security-Policy: *//')
paths=$(grep -o '<loc>[^<]*</loc>' "$repo/public/sitemap.xml" | sed 's#<loc>https://mojisashi.app##; s#</loc>##')

for path in $paths; do
  f=$(fetch "$path")
  check "deployed-pages: $path returns 200" '[ "$(status "$f")" = 200 ]' "$(status "$f") $(cat "$f.error.txt")"
  check "deployed-pages: $path is HTML" '[[ "$(header "$f" content-type)" == text/html* ]]' "$(header "$f" content-type)"
  check "deployed-headers: $path has the CSP of public/_headers" '[ "$(header "$f" content-security-policy)" = "$csp" ]' "$(header "$f" content-security-policy)"
  check "deployed-headers: $path has no-transform" '[[ "$(header "$f" cache-control)" == *no-transform* ]]' "$(header "$f" cache-control)"
  if [[ "$base" != https://mojisashi.app ]]; then
    check "deployed-headers: $path has X-Robots-Tag: noindex off production" '[ "$(header "$f" x-robots-tag)" = noindex ]' "$(header "$f" x-robots-tag)"
  fi
  check "deployed-untouched: $path has no cloudflareinsights script" '! grep -q cloudflareinsights "$f.html"' "the RUM script is in the HTML"
  check "deployed-canonical: $path names https://mojisashi.app$path" 'grep -q "<link rel=\"canonical\" href=\"https://mojisashi.app$path\"" "$f.html"' "$(grep -o '<link rel="canonical"[^>]*>' "$f.html")"
  script=$(grep -o 'src="/assets/[^"]*\.js"' "$f.html" | head -1 | sed 's/^src="//; s/"$//')
  if [ -n "$script" ]; then
    a=$(fetch "$script")
    check "deployed-assets: $script stays a year" '[ "$(header "$a" cache-control)" = "public, max-age=31536000, immutable" ]' "$(header "$a" cache-control)"
  else
    step "deployed-assets: $path loads a script under /assets/" ng "no script under /assets/ in the HTML"
  fi
  for from in "${path%/}" "${path}index.html"; do
    [ "$from" = "" ] && continue
    r=$(fetch "$from")
    check "deployed-redirects: $from moves to $path with 307" '[ "$(status "$r")" = 307 ] && [ "$(header "$r" location)" = "$path" ]' "$(status "$r") $(header "$r" location)"
  done
done
for txt in $(cd "$repo/public" && ls -- *.txt); do
  t=$(fetch "/$txt")
  check "deployed-text: /$txt is text/plain in UTF-8" '[ "$(header "$t" content-type)" = "text/plain; charset=utf-8" ]' "$(header "$t" content-type)"
done
echo "$([ $failed = 0 ] && echo "ALL PASS" || echo "$failed FAILED"); evidence in $evidence"
[ $failed = 0 ]
```

## Gotchas

- この手順が確かめるのは、公開された `dist/` です。手元のブランチの `dist/` ではありません。PR の変更を確かめるのは、`main` に入って `deploy-dev` が終わってからです。それより前に動かすと、新しいページは 404 で `FAIL` になります。手順をゆるめずに、その理由を報告します。
- `curl` の `Location` は、パスだけ（`/`）で返ります。URL 全体と比べません。
- クラウドのコンテナでは、curl がプロキシを通ります。ヘッダーのファイルの先頭には、プロキシの `HTTP/1.1 200 Connection Established` が入ります。道具は最後の応答だけを読みます。これを読み違えると、404 のページも 200 に見えます。
- 本番（`https://mojisashi.app`）に向けて動かすときは、`X-Robots-Tag` を確かめません。本番に付いていたら検索に出なくなるので、そのときは手で `curl -sI` を見ます。
- CSP は `public/_headers` の1行目のルールと比べます。手元のブランチで CSP を変えていると、公開された CSP と違って `FAIL` になります。
