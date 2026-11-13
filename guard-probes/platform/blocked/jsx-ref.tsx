// stopped-by: local/browser
export const Leak = (props: { text: string }) => (
  <div
    ref={(el) => {
      if (el !== null) Object.assign(el, { innerHTML: props.text });
    }}
  />
);
