import { useState, type ReactNode } from "react";
import { Button, Card, Choice, CopyButton, NumberField, randomBytes } from "../../../platform";
import { formatNumber } from "../../lib/format-number";
import { makeTestText, maxTestTextLength, testTextKinds, type TestTextKind } from "../lib/generate";

// The whole text can be 100,000 characters. コピー gives all of it, so the page shows only the start.
const previewLength = 500;

type Made = { kind: TestTextKind; length: number; text: string };

export function GenerateSection(): ReactNode {
  const [length, setLength] = useState<number | undefined>(undefined);
  const [kind, setKind] = useState<TestTextKind>("japanese");
  const [made, setMade] = useState<Made | undefined>(undefined);
  // A text made with other settings would be copied as if it matched the ones on screen.
  const text = made?.kind === kind && made.length === length ? made.text : undefined;

  return (
    <Card title="文字数を決めて作る">
      <NumberField label="作る文字数" min={1} max={maxTestTextLength} onNumber={setLength} />
      <Choice legend="文字の種類" options={testTextKinds} value={kind} onChoose={setKind} />
      <div>
        <Button
          disabled={length === undefined}
          onPress={() => {
            if (length !== undefined) {
              setMade({ kind, length, text: makeTestText(kind, length, randomBytes) });
            }
          }}
        >
          作る
        </Button>
      </div>
      <div className="stack-tight">
        {/* Kept in the page while empty: a live region inserted with its text is not announced. */}
        <p aria-live="polite" className="made-message">
          {text !== undefined && `${formatNumber(text.length)}文字のテスト用の文章を作りました`}
        </p>
        {text !== undefined && (
          <CopyButton text={text} messageSide="right">
            コピー
          </CopyButton>
        )}
      </div>
      {text !== undefined && (
        <div className="stack-tight">
          <p className="preview">{text.slice(0, previewLength)}</p>
          {text.length > previewLength && (
            <p className="note">
              先頭の{formatNumber(previewLength)}
              文字だけを表示しています。全部はコピーで取り出せます。
            </p>
          )}
        </div>
      )}
    </Card>
  );
}
