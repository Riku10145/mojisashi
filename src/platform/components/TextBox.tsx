import { Group, InputLabel, Textarea } from "@mantine/core";
import { useId, type ReactNode } from "react";

export type TextBoxProps = {
  label: string;
  text: string;
  onText: (text: string) => void;
  /** Shown at the right end of the label's line, such as a CopyButton for the 文章. */
  action?: ReactNode;
};

/** A labelled box for the 文章. The caller keeps the 文章 in its own state. */
export function TextBox({ label, text, onText, action }: TextBoxProps): ReactNode {
  const id = useId();
  return (
    <div>
      <Group className="label-row" justify="space-between" wrap="nowrap">
        <InputLabel htmlFor={id} className="text-box-label" size="md">
          {label}
        </InputLabel>
        {action}
      </Group>
      <Textarea
        id={id}
        size="md"
        rows={8}
        // Chrome's enhanced spell check sends the text to Google.
        spellCheck={false}
        // Otherwise Chrome writes the text into the profile's Sessions files and restores it.
        autoComplete="off"
        value={text}
        onChange={(event) => {
          onText(event.currentTarget.value);
        }}
      />
    </div>
  );
}
