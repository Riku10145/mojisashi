// stopped-by: jsx-a11y-x/click-events-have-key-events
export function Tap({ onTap }: { onTap: () => void }) {
  return <div onClick={onTap}>tap</div>;
}
