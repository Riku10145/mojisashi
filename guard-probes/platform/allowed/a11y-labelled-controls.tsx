import { useId, type ReactNode } from "react";

export function Fields(): ReactNode {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>文章</label>
      <textarea id={id} spellCheck={false} autoComplete="off" />
      <label htmlFor="count">文字数</label>
      <input id="count" type="text" />
      <label>
        <input type="radio" name="way" />
        見える文字
      </label>
      <button type="button">コピー</button>
    </div>
  );
}
