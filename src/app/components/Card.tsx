import type { ReactNode } from "react";

export type CardProps = { title: string; children: ReactNode };

/**
 * One titled part of the page, such as a 機能 or よくある質問. Below the sm width it runs edge to
 * edge, so the 文章 field is as wide as it was without cards.
 */
export function Card({ title, children }: CardProps): ReactNode {
  return (
    <section className="mt-6 space-y-6 border-y border-slate-200 bg-white p-4 shadow-sm sm:rounded-xl sm:border-x sm:p-6">
      <h2 className="text-xl font-bold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
