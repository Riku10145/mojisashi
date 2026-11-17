// stopped-by: local/control-label
import { useId } from "react";

function Name() {
  const id = useId();
  return <label htmlFor={id}>名前</label>;
}

export function Field() {
  const id = useId();
  return (
    <div>
      <Name />
      <input id={id} type="text" />
    </div>
  );
}
