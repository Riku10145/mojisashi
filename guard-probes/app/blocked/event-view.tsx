// stopped-by: local/browser
export const Leak = (props: { text: string }) => (
  <p
    onClick={(event) => {
      const v: unknown = event.view;
      return [v, props.text];
    }}
  >
    x
  </p>
);
