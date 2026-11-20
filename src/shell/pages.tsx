import { StrictMode, type ReactNode } from "react";
import { CountPage } from "../app/count/components/CountPage";
import { GeneratePage } from "../app/generate/components/GeneratePage";

// Each page by the path it is served at, as scripts/pages.ts lists them (ADR 0020).
const pages: ReadonlyMap<string, () => ReactNode> = new Map([
  ["/", CountPage],
  ["/dummy-text/", GeneratePage],
]);

export function pageAt(path: string): ReactNode {
  const Page = pages.get(path);
  if (Page === undefined) {
    throw new Error(`${path} のページはありません`);
  }
  return (
    <StrictMode>
      <Page />
    </StrictMode>
  );
}
