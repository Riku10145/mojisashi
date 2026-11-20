import { Button, Text as MantineText, Title } from "@mantine/core";
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
  children: ReactNode;
};

/** A link to another page of the site, drawn as a button so it stands out from the text. */
export function PageLink({ href, children }: PageLinkProps): ReactNode {
  return (
    <Button component="a" href={href} variant="light" size="md">
      {children}
    </Button>
  );
}
