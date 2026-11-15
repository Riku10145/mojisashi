import { CountSection } from "./count/components/CountSection";
import { GenerateSection } from "./generate/components/GenerateSection";

const countingNotes: readonly string[] = [
  "空白と改行を除いた文字数は、空白、タブ、改行を数えません。Web や Word から貼った文章に入る改行しない空白（NBSP）や、SNS で空行を作るのに使う「ㅤ」（U+3164）も、空白として扱います。",
  "空白と改行を含む文字数では、改行は、どのパソコンで書いた文章でも1文字です。",
  "どちらの数え方でも、見た目で1つに見える文字を1文字と数えます。「👨‍👩‍👧」のような組み合わせの絵文字も、濁点を組み合わせて書いた「が」も1文字です。ゼロ幅スペースのような、画面に何も出ない文字は数えません。",
];

const faq: readonly { question: string; answer: string }[] = [
  {
    question: "貼った文章は、どこかに送られますか？",
    answer:
      "送りません。数えるのは、あなたのブラウザの中だけです。ページを閉じたり再読み込みしたりすると、文章は消えます。",
  },
  {
    question: "改行や空白は数えますか？",
    answer:
      "2つの数え方を同時に出します。提出先の決まりが空白を含むか含まないかに合わせて、どちらかを見てください。",
  },
  {
    question: "絵文字は何文字と数えますか？",
    answer: "見た目で1つの絵文字は1文字です。いくつかの絵文字を組み合わせた「👨‍👩‍👧」も1文字です。",
  },
  {
    question: "400字以内のエントリーシートに使えますか？",
    answer: "使えます。目標の文字数に400と入れると、あと何文字か、何文字オーバーかが出ます。",
  },
  {
    question: "決めた文字数ちょうどの文章を作れますか？",
    answer:
      "作れます。100,000文字まで、「あいうえお」のくり返しか、英小文字をランダムに並べた文章を作ります。",
  },
];

export function App() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">文字数カウント</h1>
      <p className="mt-4 text-slate-600">
        mojisashi（もじさし）は、文章の文字数を「空白と改行を除く」と「空白と改行を含む」の2つの数え方で同時に数える、無料の文字数カウントです。決めた文字数のテスト用の文章も作れます。文章はサーバーに送らず、あなたのブラウザの中だけで数えます。登録はいりません。
      </p>
      <CountSection />
      <GenerateSection />
      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">数え方</h2>
        <ul className="list-disc space-y-2 pl-6 text-slate-700">
          {countingNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </section>
      <section className="mt-12 space-y-4">
        <h2 className="text-xl font-bold text-slate-900">よくある質問</h2>
        {faq.map(({ question, answer }) => (
          <div key={question} className="space-y-1">
            <h3 className="font-bold text-slate-900">{question}</h3>
            <p className="text-slate-700">{answer}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
