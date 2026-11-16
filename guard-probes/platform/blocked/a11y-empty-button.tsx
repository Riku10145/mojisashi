// stopped-by: jsx-a11y-x/control-has-associated-label
export function Send({ onSend }: { onSend: () => void }) {
  return <button type="button" onClick={onSend} />;
}
