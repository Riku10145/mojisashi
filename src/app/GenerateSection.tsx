import { useState, type ReactNode } from "react";
import { Button, CopyButton, NumberField, randomBytes } from "../platform";
import { formatNumber } from "./count";
import { makeTestText, maxTestTextLength } from "./generate";

/** A テスト用の文章 and how many times one was made, so each new one gets a fresh コピー button. */
type Made = { text: string; round: number };

export function GenerateSection(): ReactNode {
  const [length, setLength] = useState<number | undefined>(undefined);
  const [made, setMade] = useState<Made | undefined>(undefined);

  return (
    <section className="mt-12 space-y-6">
      <h2 className="text-xl font-bold text-slate-900">テスト用の文章を作る</h2>
      <NumberField label="作る文字数" min={1} max={maxTestTextLength} onNumber={setLength} />
      <Button
        disabled={length === undefined}
        onPress={() => {
          if (length !== undefined) {
            setMade((last) => ({
              text: makeTestText(length, randomBytes),
              round: (last?.round ?? 0) + 1,
            }));
          }
        }}
      >
        作る
      </Button>
      {/* Kept in the page while empty: a live region inserted with its text is not announced. */}
      <p aria-live="polite" className="font-bold text-slate-900">
        {made !== undefined && `${formatNumber(made.text.length)}文字のテスト用の文章を作りました`}
      </p>
      {made !== undefined && (
        <CopyButton key={made.round} text={made.text}>
          コピー
        </CopyButton>
      )}
    </section>
  );
}
