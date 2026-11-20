import type { ReactNode } from "react";
import { Box, Card, Text } from "../../platform";

export type FaqProps = { items: readonly { question: string; answer: string }[] };

/** Each answer opens under its question. The browser opens and closes it, without JavaScript. */
export function Faq({ items }: FaqProps): ReactNode {
  return (
    <Card title="よくある質問">
      <Box className="faq">
        {items.map(({ question, answer }) => (
          <Box key={question} component="details">
            <Box component="summary">{question}</Box>
            <Text>{answer}</Text>
          </Box>
        ))}
      </Box>
    </Card>
  );
}
