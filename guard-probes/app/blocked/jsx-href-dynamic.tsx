// stopped-by: local/jsx
export const Leak = (props: { text: string }) => <a href={`/?t=${props.text}`}>x</a>;
