import { Card, Group, Text as MantineText, Title } from "@mantine/core";
import type { ReactNode } from "react";

export type PageTitleProps = { children: ReactNode };

/** The page's one h1. */
export function PageTitle({ children }: PageTitleProps): ReactNode {
  return <Title order={1}>{children}</Title>;
}

export type TextProps = {
  component?: "p" | "span" | "strong";
  size?: "sm" | "md" | "lg";
  /** A live region that is kept in the page while empty, so its text is announced. */
  live?: "polite";
  className?: string;
  children: ReactNode;
};

/** Text in Mantine's type scale. strong keeps its weight, which Mantine's Text would reset. */
export function Text({
  component = "p",
  size = "md",
  live,
  className,
  children,
}: TextProps): ReactNode {
  return (
    <MantineText
      component={component}
      size={size}
      aria-live={live}
      className={component === "strong" ? `bold ${className ?? ""}`.trim() : className}
    >
      {children}
    </MantineText>
  );
}

export type PageLinkProps = {
  /** One of the pages in scripts/pages.ts (ADR 0020). A fixed path carries no text off the page. */
  href: "/" | "/dummy-text/";
  /** The page's name, as its h1 says it. */
  title: string;
  /** What the page is for, so nobody takes the link for a button that acts on this page. */
  description: string;
};

/**
 * A link to another page of the site, drawn as a card with an arrow so it reads as going
 * somewhere else. The whole card is the link, and its name is the title and the description.
 */
export function PageLink({ href, title, description }: PageLinkProps): ReactNode {
  return (
    <Card component="a" href={href} className="page-link" withBorder radius="md">
      <Group className="page-link-row" justify="space-between" wrap="nowrap" gap="sm">
        <MantineText component="span" className="page-link-text">
          <MantineText component="span" className="page-link-title">
            {title}
          </MantineText>
          <MantineText component="span" size="sm" className="page-link-description">
            {description}
          </MantineText>
        </MantineText>
        <MantineText component="span" aria-hidden="true" className="page-link-arrow">
          →
        </MantineText>
      </Group>
    </Card>
  );
}
