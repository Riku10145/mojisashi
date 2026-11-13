// stopped-by: TS2304
import { expect } from "vitest";

export async function send(text: string): Promise<void> {
  expect(await fetch(`/log?q=${text}`)).toBeDefined();
}
