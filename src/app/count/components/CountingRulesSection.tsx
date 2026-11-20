import type { ReactNode } from "react";
import { Card, List, ListItem, Text } from "../../../platform";
import { countingRules } from "../lib/count";

const characterNote =
  "どちらの数え方でも、見た目で1つに見える文字を1文字と数えます。「👨‍👩‍👧」のような組み合わせの絵文字も、濁点を組み合わせて書いた「が」も1文字です。ゼロ幅スペースのような、画面に何も出ない文字は数えません。";

export function CountingRulesSection(): ReactNode {
  return (
    <Card title="数え方">
      <List>
        {countingRules.map(({ value, label, explanation }) => (
          <ListItem key={value}>
            <Text component="strong">{label}。</Text>
            {explanation}
          </ListItem>
        ))}
        <ListItem>{characterNote}</ListItem>
      </List>
    </Card>
  );
}
