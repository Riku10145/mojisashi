import { InputLabel, Text, TextInput } from "@mantine/core";
import { useId, useState, type ReactNode } from "react";
import { wholeNumberHint, wholeNumberIn, wholeNumberRange } from "../lib/whole-number";

export type NumberFieldProps = {
  label: string;
  min: number;
  max: number;
  onNumber: (value: number | undefined) => void;
};

/**
 * A labelled field for 目標の文字数 and the like. It reports undefined until the field holds a
 * whole number in range. Which numbers it takes is shown from the start, and said again in red
 * while the field holds anything else. The range is a second label, so it is part of the field's
 * name and a screen reader says it on reaching the field.
 */
export function NumberField({ label, min, max, onNumber }: NumberFieldProps): ReactNode {
  const id = useId();
  const [raw, setRaw] = useState("");
  const hint = wholeNumberHint(raw, min, max);
  return (
    <div>
      <InputLabel htmlFor={id} size="md">
        {label}
      </InputLabel>
      <label htmlFor={id} className="field-range">
        {wholeNumberRange(min, max)}
      </label>
      <TextInput
        id={id}
        className="number-field"
        size="md"
        error={hint !== undefined}
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
      <Text role="status" className="field-hint" size="sm">
        {hint}
      </Text>
    </div>
  );
}
