import type { ReactNode } from "react";

export type ButtonProps = { children: ReactNode; onPress: () => void; disabled?: boolean };

/** A button whose handler receives nothing, so no event reaches feature code. */
export function Button({ children, onPress, disabled = false }: ButtonProps): ReactNode {
  return (
    <button
      className="rounded-md bg-slate-900 px-4 py-2 font-bold text-white disabled:opacity-50 forced-colors:border focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
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
