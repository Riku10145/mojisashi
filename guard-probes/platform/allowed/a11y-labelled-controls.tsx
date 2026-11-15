import { useId, type ReactNode } from "react";

export function Fields(): ReactNode {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>文章</label>
      <textarea id={id} spellCheck={false} autoComplete="off" />
      <label htmlFor="count">文字数</label>
      <input id="count" type="text" />
      <label htmlFor={"width"}>幅</label>
      <input id={`width`} type="text" />
      <label htmlFor="height">
        高さ
        <input id="height" type="text" />
      </label>
      <label>
        <input type="radio" name="way" />
        見える文字
      </label>
      <input type="hidden" name="mode" value="count" />
      <input type="submit" value="数える" />
      <button type="button">コピー</button>
    </div>
  );
}
