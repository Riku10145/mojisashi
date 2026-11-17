import { Card } from "./components/Card";
import { CountingRulesSection } from "./count/components/CountingRulesSection";
import { CountSection } from "./count/components/CountSection";
import { countingRules, type CountingRule } from "./count/lib/count";
import { GenerateSection } from "./generate/components/GenerateSection";
import { maxTestTextLength, testTextKinds } from "./generate/lib/generate";
import { formatNumber } from "./lib/format-number";

const countsBlanks: Readonly<Record<CountingRule, string>> = {
  withoutBlanks: "数えず",
  withBlanks: "数えます",
};

const faq: readonly { question: string; answer: string }[] = [
  {
    question: "貼った文章は、どこかに送られますか？",
    answer:
      "送りません。数えるのは、あなたのブラウザの中だけです。ページを閉じたり再読み込みしたりすると、文章は消えます。",
  },
  {
    question: "改行や空白は数えますか？",
    answer: `数え方によります。${countingRules.map(({ value, label }) => `「${label}」では${countsBlanks[value]}`).join("、")}。2つを同時に出すので、提出先の決まりに合うほうを見てください。`,
  },
  {
    question: "絵文字は何文字と数えますか？",
    answer: "見た目で1つの絵文字は1文字です。いくつかの絵文字を組み合わせた「👨‍👩‍👧」も1文字です。",
  },
  {
    question: "400文字以内のエントリーシートに使えますか？",
    answer: "使えます。目標の文字数に400と入れると、あと何文字か、何文字オーバーかが出ます。",
  },
  {
    question: "決めた文字数ちょうどの文章を作れますか？",
    answer: `作れます。文字の種類で、${testTextKinds.map(({ label }) => label).join("か")}を選び、${formatNumber(maxTestTextLength)}文字まで作れます。`,
  },
];

export function App() {
  return (
    <main className="mx-auto max-w-5xl py-10 sm:px-4">
      <header className="px-4 sm:px-0">
        <p className="text-sm font-bold tracking-wide text-blue-700">mojisashi</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">文字数カウント</h1>
        <p className="mt-4 max-w-3xl text-slate-600">
          mojisashi（もじさし）は、文章の文字数を「空白と改行を除く」と「空白と改行を含む」の2つの数え方で同時に数える文字数カウントです。決めた文字数のテスト用の文章も作れます。文章はサーバーに送らず、あなたのブラウザの中だけで数えます。登録はいりません。
        </p>
      </header>
      <CountSection />
      <GenerateSection />
      <div className="grid gap-x-6 lg:grid-cols-2 lg:items-start">
        <CountingRulesSection />
        <Card title="よくある質問">
          {faq.map(({ question, answer }) => (
            <div key={question} className="space-y-1">
              <h3 className="font-bold text-slate-900">{question}</h3>
              <p className="text-slate-700">{answer}</p>
            </div>
          ))}
        </Card>
      </div>
    </main>
  );
}
