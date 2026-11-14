#!/usr/bin/env bash
# Usage: guards-unchanged.sh <base> <head>. Exits 1 when <head> changes a guard. Reads git objects
# only and never runs code from <head>.
set -euo pipefail
base="$1"
head="$2"
merge_base="$(git merge-base "$base" "$head")"
mapfile -t paths < <(grep -v '^#' .github/guarded-paths | grep -v '^$')
changed="$(git diff --name-only "$merge_base" "$head" -- "${paths[@]}")"
# Tools find their config by name in the root, so a file added there may replace a guarded one.
added_root="$(git diff --name-only --diff-filter=A "$merge_base" "$head" -- ':(glob)*')"
# ADRs may be added, never changed or removed.
adrs="$(git diff --name-only --diff-filter=MDR "$merge_base" "$head" -- docs/adr/)"
# In package.json only dependency versions may change.
# Each is one exact version; cf alone may be a prerelease (ADR 0006, 0012).
fields='del(.dependencies, .devDependencies)'
pkg=""
if ! diff <(git show "$merge_base:package.json" | jq -S "$fields") <(git show "$head:package.json" | jq -S "$fields") >/dev/null; then
  pkg="package.json (dependencies と devDependencies のほか)"
fi
specs="$(git show "$head:package.json" | jq -r '[.dependencies, .devDependencies] | add | to_entries[] | select((.value | test("^[0-9]+\\.[0-9]+\\.[0-9]+$")) or (.key == "cf" and (.value | test("^[0-9]+\\.[0-9]+\\.[0-9]+-[0-9A-Za-z.-]+$"))) | not) | "\(.key)@\(.value)"')"
all="$(printf '%s\n' "$changed" "$added_root" "$adrs" "$pkg" "$specs" | grep -v '^$' || true)"
if [ -n "$all" ]; then
  echo "守りを決めるファイルが変わっています。人が確かめてからマージしてください（ADR 0007）:"
  printf '%s\n' "$all" | sed 's/^/  /'
  exit 1
fi
echo "守りを決めるファイルは変わっていません。"
