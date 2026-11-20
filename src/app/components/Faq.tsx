import type { ReactNode } from "react";
import { Card } from "../../platform";

export type FaqProps = { items: readonly { question: string; answer: string }[] };

/** Each answer opens under its question. The browser opens and closes it, without JavaScript. */
export function Faq({ items }: FaqProps): ReactNode {
  return (
    <Card title="よくある質問">
      <div className="faq">
        {items.map(({ question, answer }) => (
          <details key={question}>
            <summary>{question}</summary>
            <p>{answer}</p>
          </details>
        ))}
      </div>
    </Card>
  );
}
