import { useState, type ReactNode } from "react";
import { Button, Choice, CopyButton, NumberField, randomBytes } from "../../../platform";
import { formatNumber } from "../../lib/format-number";
import { makeTestText, maxTestTextLength, testTextKinds, type TestTextKind } from "../lib/generate";

export function GenerateSection(): ReactNode {
  const [length, setLength] = useState<number | undefined>(undefined);
  const [kind, setKind] = useState<TestTextKind>("japanese");
  const [made, setMade] = useState<string | undefined>(undefined);

  return (
    <section className="mt-12 space-y-6">
      <h2 className="text-xl font-bold text-slate-900">テスト用の文章を作る</h2>
      <NumberField label="作る文字数" min={1} max={maxTestTextLength} onNumber={setLength} />
      <Choice legend="文字の種類" options={testTextKinds} value={kind} onChoose={setKind} />
      <Button
        disabled={length === undefined}
        onPress={() => {
          if (length !== undefined) {
            setMade(makeTestText(kind, length, randomBytes));
          }
        }}
      >
        作る
      </Button>
      <div className="flex flex-wrap items-center justify-between gap-2">
        {/* Kept in the page while empty: a live region inserted with its text is not announced. */}
        <p aria-live="polite" className="font-bold text-slate-900">
          {made !== undefined && `${formatNumber(made.length)}文字のテスト用の文章を作りました`}
        </p>
        {made !== undefined && <CopyButton text={made}>コピー</CopyButton>}
      </div>
      {made !== undefined && (
        <p className="max-h-48 overflow-y-auto rounded-md border border-slate-300 bg-slate-50 p-3 break-all text-slate-900">
          {made}
        </p>
      )}
    </section>
  );
}
