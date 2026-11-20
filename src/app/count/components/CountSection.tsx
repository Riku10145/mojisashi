import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import {
  Box,
  Card,
  Choice,
  CopyButton,
  NumberCard,
  NumberField,
  Stack,
  Text,
  TextBox,
} from "../../../platform";
import { formatNumber } from "../../lib/format-number";
import { countCharacters, countingRules, gapMessage, type CountingRule } from "../lib/count";

export function CountSection(): ReactNode {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<number | undefined>(undefined);
  const [rule, setRule] = useState<CountingRule>("withoutBlanks");
  // A long paste is counted after the keystroke renders, so typing stays responsive.
  const deferredText = useDeferredValue(text);
  const counts = useMemo(() => countCharacters(deferredText), [deferredText]);

  return (
    <Card title="文字数を数える">
      <Box className="count-layout">
        <TextBox
          label="文章"
          text={text}
          onText={setText}
          action={
            <CopyButton text={text} messageSide="left">
              文章をコピー
            </CopyButton>
          }
        />
        <Stack gap="lg">
          <Box component="dl" className="counts">
            {countingRules.map(({ value, label }) => (
              <NumberCard
                key={value}
                label={label}
                value={formatNumber(counts[value])}
                unit="文字"
              />
            ))}
          </Box>
          <Box className="target">
            <NumberField label="目標の文字数" min={1} max={1_000_000} onNumber={setTarget} />
            <Choice
              legend="目標と比べる数え方"
              options={countingRules}
              value={rule}
              onChoose={setRule}
            />
          </Box>
          {/* Kept in the page while empty: a live region inserted with its text is not announced. */}
          <Text live="polite" size="lg" className="gap-message">
            {target !== undefined && gapMessage(target, counts[rule])}
          </Text>
        </Stack>
      </Box>
    </Card>
  );
}
