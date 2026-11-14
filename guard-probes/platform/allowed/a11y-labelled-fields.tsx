import { useId } from "react";

export function Fields() {
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>name</label>
      <textarea id={id} />
      <label>
        <input type="text" />
        age
      </label>
      <button type="button">send</button>
    </div>
  );
}
