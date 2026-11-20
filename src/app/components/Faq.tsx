import type { ReactNode } from "react";
import { Card } from "./Card";

export type FaqProps = { items: readonly { question: string; answer: string }[] };

export function Faq({ items }: FaqProps): ReactNode {
  return (
    <Card title="よくある質問">
      {items.map(({ question, answer }) => (
        <div key={question} className="space-y-1">
          <h3 className="font-bold text-slate-900">{question}</h3>
          <p className="text-slate-700">{answer}</p>
        </div>
      ))}
    </Card>
  );
}
