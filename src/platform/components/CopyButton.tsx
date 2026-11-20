import { useState, type ReactNode } from "react";

export type CopyButtonProps = {
  text: string;
  /** Put the message on the side away from where the button is pinned, or the message pushes it. */
  messageSide: "left" | "right";
  children: ReactNode;
};

type Copy = { outcome: "copied" | "failed"; text: string };

/**
 * Copies text to the clipboard and says whether it worked. The message is for the text it copied,
 * so it goes away once the text changes. With no text there is nothing to copy, so it is disabled.
 */
export function CopyButton({ text, messageSide, children }: CopyButtonProps): ReactNode {
  const [last, setLast] = useState<Copy | undefined>(undefined);
  const outcome = last?.text === text ? last.outcome : undefined;
  const message = (
    <p role="status" className="min-w-0 text-sm text-slate-600">
      {outcome === "copied"
        ? "コピーしました"
        : outcome === "failed"
          ? "コピーできませんでした"
          : ""}
    </p>
  );
  const button = (
    <button
      className="shrink-0 whitespace-nowrap rounded-md bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50 forced-colors:border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
      type="button"
      disabled={text === ""}
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => {
            setLast({ outcome: "copied", text });
          },
          () => {
            setLast({ outcome: "failed", text });
          },
        );
      }}
    >
      {children}
    </button>
  );
  return (
    <div className="flex items-center gap-3">
      {messageSide === "left" ? (
        <>
          {message}
          {button}
        </>
      ) : (
        <>
          {button}
          {message}
        </>
      )}
    </div>
  );
}
