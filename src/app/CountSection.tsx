import { useDeferredValue, useMemo, useState, type ReactNode } from "react";
import { Choice, NumberField, TextBox } from "../platform";
import {
  countCharacters,
  countingRules,
  formatNumber,
  gapMessage,
  type CountingRule,
} from "./count";

export function CountSection(): ReactNode {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<number | undefined>(undefined);
  const [rule, setRule] = useState<CountingRule>("withoutBlanks");
  // A long paste is counted after the keystroke renders, so typing stays responsive.
  const deferredText = useDeferredValue(text);
  const counts = useMemo(() => countCharacters(deferredText), [deferredText]);

  return (
    <section className="mt-8 space-y-6">
      <h2 className="text-xl font-bold text-slate-900">文字数を数える</h2>
      <TextBox label="文章" text={text} onText={setText} />
      <dl className="space-y-1">
        {countingRules.map(({ value, label }) => (
          <div key={value} className="flex justify-between gap-4">
            <dt className="text-slate-600">{label}</dt>
            <dd className="font-bold text-slate-900">{formatNumber(counts[value])}文字</dd>
          </div>
        ))}
      </dl>
      <NumberField label="目標の文字数" min={1} max={1_000_000} onNumber={setTarget} />
      <Choice legend="目標と比べる数え方" options={countingRules} value={rule} onChoose={setRule} />
      {target !== undefined && (
        <p aria-live="polite" className="font-bold text-slate-900">
          {gapMessage(target, counts[rule])}
        </p>
      )}
    </section>
  );
}
