import { useState, type ReactNode } from "react";

export function Paste(props: { onText: (text: string) => void }): ReactNode {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <label>
        文章
        <textarea
          spellCheck={false}
          onChange={(event) => {
            props.onText(event.currentTarget.value);
          }}
        />
      </label>
      <button
        type="button"
        onClick={() => {
          void navigator.clipboard.writeText("abc").then(() => {
            setCopied(true);
          });
        }}
      >
        {copied ? "コピーしました" : "コピー"}
      </button>
    </div>
  );
}

export function bytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}
