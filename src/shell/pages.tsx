import { MantineProvider, type MantineColorSchemeManager } from "@mantine/core";
import { StrictMode, type ReactNode } from "react";
import { CountPage } from "../app/count/components/CountPage";
import { GeneratePage } from "../app/generate/components/GeneratePage";

// Each page by the path it is served at, as scripts/pages.ts lists them (ADR 0020).
const pages: ReadonlyMap<string, () => ReactNode> = new Map([
  ["/", CountPage],
  ["/dummy-text/", GeneratePage],
]);

// Mantine's default manager keeps the color scheme in localStorage. The page keeps nothing (ADR 0001).
const keepNothing: MantineColorSchemeManager = {
  get: (defaultValue) => defaultValue,
  set: () => undefined,
  subscribe: () => undefined,
  unsubscribe: () => undefined,
  clear: () => undefined,
};

export function pageAt(path: string): ReactNode {
  const Page = pages.get(path);
  if (Page === undefined) {
    throw new Error(`${path} のページはありません`);
  }
  return (
    <StrictMode>
      {/* Both <style> elements Mantine would add are refused by the CSP; index.css holds the same. */}
      <MantineProvider
        forceColorScheme="light"
        colorSchemeManager={keepNothing}
        withCssVariables={false}
        withGlobalClasses={false}
      >
        <Page />
      </MantineProvider>
    </StrictMode>
  );
}
