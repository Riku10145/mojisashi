// stopped-by: TS2322
import { TextBox } from "../../../src/platform";

export const Box = (props: { text: string; onText: (text: string) => void }) => (
  <TextBox label="文章" text={props.text} onText={props.onText} spellCheck />
);
