import { Button, Group, Text } from "@mantine/core";
import { useState, type ReactNode } from "react";

export type CopyButtonProps = {
  text: string;
  /** Put the message on the side away from where the button is pinned, or the message pushes it. */
  messageSide: "left" | "right";
  children: ReactNode;
};

type Copy = { outcome: "copied" | "failed"; text: string };

/**
 * Copies text to the clipboard and says whether it worked. The message is for the text it copied,
 * so it goes away once the text changes. With no text there is nothing to copy, so it is disabled.
 */
export function CopyButton({ text, messageSide, children }: CopyButtonProps): ReactNode {
  const [last, setLast] = useState<Copy | undefined>(undefined);
  const outcome = last?.text === text ? last.outcome : undefined;
  const message = (
    <Text role="status" className="copy-message" size="sm">
      {outcome === "copied"
        ? "コピーしました"
        : outcome === "failed"
          ? "コピーできませんでした"
          : ""}
    </Text>
  );
  const button = (
    <Button
      className="copy-button"
      type="button"
      size="sm"
      variant="light"
      disabled={text === ""}
      onClick={() => {
        navigator.clipboard.writeText(text).then(
          () => {
            setLast({ outcome: "copied", text });
          },
          () => {
            setLast({ outcome: "failed", text });
          },
        );
      }}
    >
      {children}
    </Button>
  );
  return (
    <Group gap="sm" wrap="nowrap">
      {messageSide === "left" ? (
        <>
          {message}
          {button}
        </>
      ) : (
        <>
          {button}
          {message}
        </>
      )}
    </Group>
  );
}
