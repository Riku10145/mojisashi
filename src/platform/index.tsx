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
      <label htmlFor={id} className="block font-bold text-slate-900">
        {label}
      </label>
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

/**
 * A whole number from min to max, or undefined. Full-width digits count, as an IME types them,
 * and so do thousands separators in their places, as in 1,000.
 */
export function wholeNumberIn(raw: string, min: number, max: number): number | undefined {
  const written = raw.normalize("NFKC").trim();
  if (!/^(\d+|\d{1,3}(,\d{3})+)$/.test(written)) {
    return undefined;
  }
  const value = Number(written.replaceAll(",", ""));
  return value >= min && value <= max ? value : undefined;
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

export type ButtonProps = { children: ReactNode; onPress: () => void; disabled?: boolean };

/** A button whose handler receives nothing, so no event reaches feature code. */
export function Button({ children, onPress, disabled = false }: ButtonProps): ReactNode {
  return (
    <button
      className="rounded-md bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
        className="rounded-md bg-slate-900 px-4 py-2 font-bold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
      <p role="status" className="mt-2 text-slate-600">
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
