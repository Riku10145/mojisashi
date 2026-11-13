// stopped-by: local/jsx
export const Leak = (props: { text: string }) => <img alt="" src={`/p?t=${props.text}`} />;
