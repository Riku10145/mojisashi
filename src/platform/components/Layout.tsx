import {
  Box as MantineBox,
  Container as MantineContainer,
  List as MantineList,
  ListItem as MantineListItem,
  Stack as MantineStack,
} from "@mantine/core";
import type { ReactNode } from "react";

// Mantine's components take any element through component, and style and event props too. The
// ones here take a few named elements and a class only, so src/app/ stays inside ADR 0007.

type Gap = "xs" | "sm" | "md" | "lg";

export type BoxProps = {
  /** details and summary open and close without JavaScript (ADR 0021). */
  component?: "div" | "dl" | "details" | "summary";
  className?: string;
  children: ReactNode;
};

/** A block with no look of its own, laid out by its class. */
export function Box({ component = "div", className, children }: BoxProps): ReactNode {
  return (
    <MantineBox component={component} className={className}>
      {children}
    </MantineBox>
  );
}

export type StackProps = {
  component?: "div" | "header";
  gap?: Gap;
  className?: string;
  children: ReactNode;
};

/** Children one under another, gap apart. */
export function Stack({
  component = "div",
  gap = "md",
  className,
  children,
}: StackProps): ReactNode {
  return (
    // The class tells mantine-styles.css which gap each stack has (ADR 0022).
    <MantineStack
      component={component}
      gap={gap}
      className={`stack-${gap} ${className ?? ""}`.trim()}
    >
      {children}
    </MantineStack>
  );
}

export type ContainerProps = { className?: string; children: ReactNode };

/** The page's <main>, centred at Mantine's lg width. */
export function Main({ className, children }: ContainerProps): ReactNode {
  return (
    <MantineContainer component="main" size="lg" className={className}>
      {children}
    </MantineContainer>
  );
}

export type ListProps = { spacing?: Gap; className?: string; children: ReactNode };

/** A bulleted list of ListItem. */
export function List({ spacing = "xs", className, children }: ListProps): ReactNode {
  return (
    <MantineList spacing={spacing} className={`list-${spacing} ${className ?? ""}`.trim()}>
      {children}
    </MantineList>
  );
}

export type ListItemProps = { children: ReactNode };

export function ListItem({ children }: ListItemProps): ReactNode {
  return <MantineListItem>{children}</MantineListItem>;
}
