// stopped-by: local/browser
export const Leak = (props: { text: string }) => (
  <p
    onClick={(event) => {
      Object.assign(event.currentTarget, { innerHTML: props.text });
    }}
  >
    x
  </p>
);
