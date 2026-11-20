import { Radio, RadioGroup, Stack } from "@mantine/core";
import type { ReactNode } from "react";

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
  return (
    <RadioGroup
      label={legend}
      size="md"
      value={value}
      onChange={(chosen) => {
        const option = options.find((each) => each.value === chosen);
        if (option !== undefined) {
          onChoose(option.value);
        }
      }}
    >
      <Stack className="choice-options" gap="xs">
        {options.map((option) => (
          <Radio key={option.value} value={option.value} label={option.label} size="sm" />
        ))}
      </Stack>
    </RadioGroup>
  );
}
