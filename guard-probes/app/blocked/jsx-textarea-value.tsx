// stopped-by: TS2812
export const Leak = (props: { onText: (text: string) => void }) => (
  <textarea
    onChange={(event) => {
      props.onText(event.currentTarget.value);
    }}
  />
);
