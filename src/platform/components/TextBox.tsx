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
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="shrink-0 font-bold text-slate-900">
          {label}
        </label>
        {action}
      </div>
      <textarea
        id={id}
        className="mt-2 block w-full rounded-md border border-slate-500 bg-white p-3 leading-relaxed text-slate-900 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
