import type { ReactNode } from "react";
import { Box, Card, PageLink, Text } from "../../../platform";
import { Faq } from "../../components/Faq";
import { PageLayout } from "../../components/PageLayout";
import { countingRules, type CountingRule } from "../lib/count";
import { CountingRulesSection } from "./CountingRulesSection";
import { CountSection } from "./CountSection";

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
];

/** The page at /. */
export function CountPage(): ReactNode {
  return (
    <PageLayout
      title="文字数カウント"
      lead={
        <>
          <Text>文章はサーバーに送らず、あなたのブラウザの中だけで数えます。</Text>
          <Box>
            <PageLink href="/dummy-text/">テスト用の文章を作る</PageLink>
          </Box>
        </>
      }
    >
      <CountSection />
      <Box className="two-columns">
        <CountingRulesSection />
        <Faq items={faq} />
      </Box>
      {/* The whole introduction, below the tool so a phone shows the 文章 field sooner. llms.txt and
          the JSON-LD quote it, so it stays in the page as one paragraph. */}
      <Card title="mojisashi について">
        <Text>
          mojisashi（もじさし）は、文章の文字数を「空白と改行を除く」と「空白と改行を含む」の2つの数え方で同時に数える文字数カウントです。文章はサーバーに送らず、あなたのブラウザの中だけで数えます。登録はいりません。
        </Text>
      </Card>
    </PageLayout>
  );
}
