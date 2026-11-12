# Cloudflare Workers に置く

mojisashi は、サーバーで何も処理しない静的なサイトとして、Cloudflare Workers に置きます。Vercel の無料プランは、個人の、商用でない利用に限られています。あとで広告を入れると商用の利用にあたり、有料プランに移る必要が出るかもしれません。Cloudflare では、静的なファイルへのアクセスは無料で、回数の上限もありません。また、Cloudflare は新しいプロジェクトには Pages より Workers を勧めているため、Pages ではなく Workers を選びました。
