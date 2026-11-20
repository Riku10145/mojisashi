import type { ReactNode } from "react";
import { PageTitle } from "../../platform";

export type PageLayoutProps = { title: string; lead: ReactNode; children: ReactNode };

/** One page of the site: the name, the page's h1, the paragraphs that say what it is for, its cards. */
export function PageLayout({ title, lead, children }: PageLayoutProps): ReactNode {
  return (
    <main className="page">
      <header className="page-header">
        <p className="brand">mojisashi</p>
        <PageTitle>{title}</PageTitle>
        <div className="lead">{lead}</div>
      </header>
      {children}
    </main>
  );
}
