import type { ReactNode } from "react";
import { Card } from "./Card";

export type FaqProps = { items: readonly { question: string; answer: string }[] };

/** Each answer opens under its question. The browser opens and closes it, without JavaScript. */
export function Faq({ items }: FaqProps): ReactNode {
  return (
    <Card title="よくある質問">
      <div className="divide-y divide-slate-200 border-y border-slate-200">
        {items.map(({ question, answer }) => (
          <details key={question} className="py-3">
            <summary className="cursor-pointer font-bold text-slate-900">{question}</summary>
            <p className="mt-2 text-slate-700">{answer}</p>
          </details>
        ))}
      </div>
    </Card>
  );
}
