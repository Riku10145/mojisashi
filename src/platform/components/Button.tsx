import { Button as MantineButton } from "@mantine/core";
import type { ReactNode } from "react";

export type ButtonProps = { children: ReactNode; onPress: () => void; disabled?: boolean };

/** A button whose handler receives nothing, so no event reaches feature code. */
export function Button({ children, onPress, disabled = false }: ButtonProps): ReactNode {
  return (
    <MantineButton
      type="button"
      size="md"
      disabled={disabled}
      onClick={() => {
        onPress();
      }}
    >
      {children}
    </MantineButton>
  );
}
