// The only code that features use to reach the browser (ADR 0007). Everything exported here takes
// and gives strings, numbers, Uint8Array and React components, so src/app never holds an element,
// an event or any other browser object.
import { useId, useState, type ReactNode } from "react";

export type TextBoxProps = { label: string; text: string; onText: (text: string) => void };

/** A labelled box for the 文章. The caller keeps the 文章 in its own state. */
export function TextBox({ label, text, onText }: TextBoxProps): ReactNode {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <textarea
        id={id}
        rows={8}
        // Chrome's enhanced spell check sends the text to Google.
        spellCheck={false}
        value={text}
        onChange={(event) => {
          onText(event.currentTarget.value);
        }}
      />
    </div>
  );
}

/** A whole number from min to max, or undefined. Full-width digits count, as an IME types them. */
export function wholeNumberIn(raw: string, min: number, max: number): number | undefined {
  const digits = raw.normalize("NFKC").trim();
  const value = Number(digits);
  return /^\d+$/.test(digits) && value >= min && value <= max ? value : undefined;
}

export type NumberFieldProps = {
  label: string;
  min: number;
  max: number;
  onNumber: (value: number | undefined) => void;
};

/** A labelled field for 目標の文字数 and the like. It reports undefined until the field holds a whole number in range. */
export function NumberField({ label, min, max, onNumber }: NumberFieldProps): ReactNode {
  const id = useId();
  const [raw, setRaw] = useState("");
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={raw}
        onChange={(event) => {
          const next = event.currentTarget.value;
          setRaw(next);
          onNumber(wholeNumberIn(next, min, max));
        }}
      />
    </div>
  );
}

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
      <legend>{legend}</legend>
      {options.map((option) => (
        <label key={option.value}>
          <input
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

export type ButtonProps = { children: ReactNode; onPress: () => void; disabled?: boolean };

/** A button whose handler receives nothing, so no event reaches feature code. */
export function Button({ children, onPress, disabled = false }: ButtonProps): ReactNode {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        onPress();
      }}
    >
      {children}
    </button>
  );
}

export type CopyButtonProps = { text: string; children: ReactNode };

/** Copies text to the clipboard and says whether it worked. */
export function CopyButton({ text, children }: CopyButtonProps): ReactNode {
  const [state, setState] = useState<"idle" | "copied" | "failed">("idle");
  return (
    <div>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(text).then(
            () => {
              setState("copied");
            },
            () => {
              setState("failed");
            },
          );
        }}
      >
        {children}
      </button>
      <p role="status">
        {state === "copied" ? "コピーしました" : state === "failed" ? "コピーできませんでした" : ""}
      </p>
    </div>
  );
}

// crypto.getRandomValues fills at most this many bytes per call.
const maxBytesPerCall = 65_536;

/** n random bytes from the browser's cryptographic generator. */
export function randomBytes(n: number): Uint8Array {
  const bytes = new Uint8Array(n);
  for (let start = 0; start < n; start += maxBytesPerCall) {
    crypto.getRandomValues(bytes.subarray(start, Math.min(start + maxBytesPerCall, n)));
  }
  return bytes;
}
