import { useId, useState, type ReactNode } from "react";
import { wholeNumberHint, wholeNumberIn } from "../lib/whole-number";

export type NumberFieldProps = {
  label: string;
  min: number;
  max: number;
  onNumber: (value: number | undefined) => void;
};

/**
 * A labelled field for 目標の文字数 and the like. It reports undefined until the field holds a
 * whole number in range, and says which numbers it takes while it holds anything else.
 */
export function NumberField({ label, min, max, onNumber }: NumberFieldProps): ReactNode {
  const id = useId();
  const [raw, setRaw] = useState("");
  return (
    <div>
      <label htmlFor={id} className="block font-bold text-slate-900">
        {label}
      </label>
      <input
        id={id}
        className="mt-2 block w-40 rounded-md border border-slate-500 bg-white px-3 py-2 text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={(event) => {
          const next = event.currentTarget.value;
          setRaw(next);
          onNumber(wholeNumberIn(next, min, max));
        }}
      />
      {/* Kept in the page while empty: a live region inserted with its text is not announced. */}
      <p role="status" className="mt-1 text-sm text-red-700">
        {wholeNumberHint(raw, min, max)}
      </p>
    </div>
  );
}
