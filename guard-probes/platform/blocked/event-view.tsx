// stopped-by: local/browser
export const Leak = (props: { text: string }) => (
  <button
    type="button"
    onClick={(event) => {
      const view: unknown = event.view;
      if (typeof view === "object" && view !== null) {
        Object.assign(view, { name: props.text });
      }
    }}
  >
    x
  </button>
);
