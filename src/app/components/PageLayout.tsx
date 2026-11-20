import type { ReactNode } from "react";
import { Main, PageTitle, Stack, Text } from "../../platform";

export type PageLayoutProps = { title: string; lead: ReactNode; children: ReactNode };

/** One page of the site: the name, the page's h1, the paragraphs that say what it is for, its cards. */
export function PageLayout({ title, lead, children }: PageLayoutProps): ReactNode {
  return (
    <Main className="page">
      <Stack component="header" gap="xs" className="page-header">
        <Text size="sm" className="brand">
          mojisashi
        </Text>
        <PageTitle>{title}</PageTitle>
        <Stack gap="xs" className="lead">
          {lead}
        </Stack>
      </Stack>
      {children}
    </Main>
  );
}
