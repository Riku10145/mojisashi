# 決まりは、機械的に止められる道具で守る

mojisashi は、ほぼすべてのコードをAIのエージェントが書きます。エージェントは、文章で頼んだ決まりを見落としたり、場当たり的な回避策で済ませたりすることがあります。そこで、決まりはできるだけ型、リンター、整形、テスト、CIのような、破ると機械的に止まる道具で守ります。道具を選ぶときも、決まりを機械的に止められるかを基準にします。

具体的には、TypeScript を最もきびしい設定（`strict`、`noUncheckedIndexedAccess`、`exactOptionalPropertyTypes`）にし、ESLint で typescript-eslint の `strictTypeChecked` を使い、`any`、`!` による決めつけ、`as` による型の書き換えを禁止します。PRでは GitHub Actions が型チェック、ESLint、Oxfmt の整形チェック、Vitest のテスト、ビルドを動かし、1つでも失敗したらマージできません。コミットの前にも、lefthook で同じチェックを動かします。
