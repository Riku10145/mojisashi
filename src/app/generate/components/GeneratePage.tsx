import type { ReactNode } from "react";
import { Faq } from "../../components/Faq";
import { PageLayout } from "../../components/PageLayout";
import { formatNumber } from "../../lib/format-number";
import { maxTestTextLength, testTextKinds } from "../lib/generate";
import { GenerateSection } from "./GenerateSection";

const faq: readonly { question: string; answer: string }[] = [
  {
    question: "何文字まで作れますか？",
    answer: `${formatNumber(maxTestTextLength)}文字まで作れます。文字の種類で、${testTextKinds.map(({ label }) => label).join("か")}を選べます。`,
  },
  {
    question: "日本語の文章は、どんな中身ですか？",
    answer: "「あいうえお」をくり返し、決めた文字数で切ります。7文字なら「あいうえおあい」です。",
  },
  {
    question: "作った文章は、どこかに送られますか？",
    answer:
      "送りません。作るのは、あなたのブラウザの中だけです。ページを閉じたり再読み込みしたりすると、作った文章は消えます。",
  },
];

/** The page at /dummy-text/ (ADR 0020). */
export function GeneratePage(): ReactNode {
  return (
    <PageLayout
      title="テスト用の文章を作る"
      lead={
        <>
          <p>
            決めた文字数ちょうどのテスト用の文章を、ボタン1つで作れます。入力欄の文字数の上限を試すときに使います。文章はサーバーに送らず、あなたのブラウザの中だけで作ります。
          </p>
          <p>
            文章の文字数を数えるときは、
            <a href="/" className="font-bold text-blue-700 underline">
              文字数カウント
            </a>
            のページを使います。
          </p>
        </>
      }
    >
      <GenerateSection />
      <Faq items={faq} />
    </PageLayout>
  );
}
