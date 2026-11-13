// stopped-by: local/jsx
export const Leak = (props: { text: string }) => (
  <a href="/" ping={`/p?t=${props.text}`}>
    x
  </a>
);
