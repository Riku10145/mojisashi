import type { ReactNode } from "react";
import { countingRules } from "../lib/count";

const characterNote =
  "どちらの数え方でも、見た目で1つに見える文字を1文字と数えます。「👨‍👩‍👧」のような組み合わせの絵文字も、濁点を組み合わせて書いた「が」も1文字です。ゼロ幅スペースのような、画面に何も出ない文字は数えません。";

export function CountingRulesSection(): ReactNode {
  return (
    <section className="mt-6 space-y-4 border-y border-slate-200 bg-white p-4 shadow-sm sm:rounded-xl sm:border-x sm:p-6">
      <h2 className="text-xl font-bold text-slate-900">数え方</h2>
      <ul className="list-disc space-y-2 pl-6 text-slate-700">
        {countingRules.map(({ value, label, explanation }) => (
          <li key={value}>
            <strong>{label}。</strong>
            {explanation}
          </li>
        ))}
        <li>{characterNote}</li>
      </ul>
    </section>
  );
}
