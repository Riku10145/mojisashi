import { useState, type ReactNode } from "react";
import {
  Button,
  Choice,
  CopyButton,
  NumberField,
  randomBytes,
  TextBox,
} from "../../../src/platform";

type Rule = "without-spaces" | "with-spaces";
const rules = [
  { value: "without-spaces", label: "空白と改行を除く" },
  { value: "with-spaces", label: "空白と改行を含む" },
] as const;
const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });
const countOf = (text: string, rule: Rule) =>
  [...segmenter.segment(rule === "with-spaces" ? text : text.replace(/\s/g, ""))].length;
const letters = (n: number) =>
  Array.from(randomBytes(n), (byte) => String.fromCharCode(97 + (byte % 26))).join("");

export function Count(): ReactNode {
  const [text, setText] = useState("");
  const [target, setTarget] = useState<number | undefined>(undefined);
  const [rule, setRule] = useState<Rule>("without-spaces");
  const [made, setMade] = useState("");
  const rest = target === undefined ? undefined : target - countOf(text, rule);
  return (
    <section className="mt-8">
      <TextBox label="文章" text={text} onText={setText} />
      <NumberField label="目標の文字数" min={1} max={1_000_000} onNumber={setTarget} />
      <Choice legend="比べる数え方" options={rules} value={rule} onChoose={setRule} />
      {rest !== undefined && (
        <output aria-live="polite">
          {rest < 0 ? `${String(-rest)}文字オーバー` : `あと${String(rest)}文字`}
        </output>
      )}
      <Button
        onPress={() => {
          setMade(letters(target ?? 0));
        }}
      >
        作る
      </Button>
      {made !== "" && <CopyButton text={made}>コピー</CopyButton>}
      <a href="https://mojisashi.app">mojisashi</a>
    </section>
  );
}
