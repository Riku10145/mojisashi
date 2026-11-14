// stopped-by: local/field-label
export function Name({ id }: { id: string }) {
  return <label htmlFor={id}>name</label>;
}

export function Field({ id }: { id: string }) {
  return <input id={id} type="text" />;
}
