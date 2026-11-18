import type { ReactNode } from "react";

export type PageLayoutProps = { title: string; lead: ReactNode; children: ReactNode };

/** One page of the site: the name, the page's h1, the paragraphs that say what it is for, its cards. */
export function PageLayout({ title, lead, children }: PageLayoutProps): ReactNode {
  return (
    <main className="mx-auto max-w-5xl py-10 sm:px-4">
      <header className="px-4 sm:px-0">
        <p className="text-sm font-bold tracking-wide text-blue-700">mojisashi</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
        <div className="mt-4 max-w-3xl space-y-2 text-slate-600">{lead}</div>
      </header>
      {children}
    </main>
  );
}
