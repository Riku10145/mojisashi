import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Choice, CopyButton, NumberField, TextBox } from "../../../platform";
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
    <section className="mt-8 space-y-6 border-y border-slate-200 bg-white p-4 shadow-sm sm:rounded-xl sm:border-x sm:p-6">
      <h2 className="text-xl font-bold text-slate-900">文字数を数える</h2>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <TextBox
          label="文章"
          text={text}
          onText={setText}
          action={<CopyButton text={text}>文章をコピー</CopyButton>}
        />
        <div className="space-y-6">
          <dl className="grid grid-cols-2 gap-3 lg:grid-cols-1">
            {countingRules.map(({ value, label }) => (
              <div key={value} className="rounded-lg bg-slate-100 p-4">
                <dt className="text-sm text-slate-600">{label}</dt>
                <dd className="mt-1 font-bold text-slate-900">
                  <span className="text-3xl tabular-nums">{formatNumber(counts[value])}</span>
                  <span className="ml-1 text-sm">文字</span>
                </dd>
              </div>
            ))}
          </dl>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-1">
            <NumberField label="目標の文字数" min={1} max={1_000_000} onNumber={setTarget} />
            <Choice
              legend="目標と比べる数え方"
              options={countingRules}
              value={rule}
              onChoose={setRule}
            />
          </div>
          {/* Kept in the page while empty: a live region inserted with its text is not announced. */}
          <p aria-live="polite" className="text-lg font-bold text-slate-900">
            {target !== undefined && gapMessage(target, counts[rule])}
          </p>
        </div>
      </div>
    </section>
  );
}
