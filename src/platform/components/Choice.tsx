import { useId, type ReactNode } from "react";

export type ChoiceProps<T extends string> = {
  legend: string;
  options: readonly { value: T; label: string }[];
  value: T;
  onChoose: (value: T) => void;
};

/** Radio buttons such as 数え方. The chosen option comes back as the caller's own value. */
export function Choice<T extends string>({
  legend,
  options,
  value,
  onChoose,
}: ChoiceProps<T>): ReactNode {
  const name = useId();
  return (
    <fieldset>
      <legend className="font-bold text-slate-900">{legend}</legend>
      {options.map((option) => (
        <label key={option.value} className="mt-2 flex items-center gap-2 text-slate-900">
          <input
            className="size-4 accent-blue-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            type="radio"
            name={name}
            checked={option.value === value}
            onChange={() => {
              onChoose(option.value);
            }}
          />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}
