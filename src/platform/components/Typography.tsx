import { Anchor, Text as MantineText, Title } from "@mantine/core";
import type { ReactNode } from "react";

export type PageTitleProps = { children: ReactNode };

/** The page's one h1. */
export function PageTitle({ children }: PageTitleProps): ReactNode {
  return <Title order={1}>{children}</Title>;
}

export type TextProps = { children: ReactNode };

/** A paragraph in Mantine's type scale. */
export function Text({ children }: TextProps): ReactNode {
  return <MantineText>{children}</MantineText>;
}

export type PageLinkProps = {
  /** One of the pages in scripts/pages.ts (ADR 0020). A fixed path carries no text off the page. */
  href: "/" | "/dummy-text/";
  children: ReactNode;
};

/** A link to another page of the site. */
export function PageLink({ href, children }: PageLinkProps): ReactNode {
  return (
    <Anchor href={href} className="page-link" underline="always">
      {children}
    </Anchor>
  );
}
