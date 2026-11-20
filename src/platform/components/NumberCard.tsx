import { Card, Text } from "@mantine/core";
import type { ReactNode } from "react";

export type NumberCardProps = { label: string; value: string; unit: string };

/**
 * One number with what it counts, such as 空白と改行を除いた文字数. The label and the number are a
 * <dt> and its <dd>, so the caller puts the cards in a <dl>.
 */
export function NumberCard({ label, value, unit }: NumberCardProps): ReactNode {
  return (
    <Card className="number-card" radius="md">
      <Text component="dt" className="number-card-label" size="sm">
        {label}
      </Text>
      <Text component="dd" className="number-card-value">
        <Text span className="number-card-number">
          {value}
        </Text>
        <Text span className="number-card-unit" size="sm">
          {unit}
        </Text>
      </Text>
    </Card>
  );
}
