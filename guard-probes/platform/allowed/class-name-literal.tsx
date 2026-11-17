import type { ReactNode } from "react";

export function Box(): ReactNode {
  return (
    <label>
      文章
      <textarea className="block w-full rounded-md border border-slate-300" />
    </label>
  );
}
