import { Paper, Stack, Title } from "@mantine/core";
import type { ReactNode } from "react";

export type CardProps = { title: string; children: ReactNode };

/**
 * One titled part of the page, such as a 機能 or よくある質問. Below the sm width it runs edge to
 * edge, so the 文章 field is as wide as it was without cards.
 */
export function Card({ title, children }: CardProps): ReactNode {
  return (
    <Paper component="section" className="card" withBorder shadow="xs" radius="md">
      <Stack gap="lg">
        <Title order={2} size="h3">
          {title}
        </Title>
        {children}
      </Stack>
    </Paper>
  );
}
