import { useState } from "react";

const segmenter = new Intl.Segmenter("ja", { granularity: "grapheme" });

export function Page() {
  const [text, setText] = useState("");
  const count = Array.from(segmenter.segment(text)).length;
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <label htmlFor="text" className="block text-slate-900">
        文章
      </label>
      <textarea
        id="text"
        value={text}
        onChange={(event) => {
          setText(event.target.value);
        }}
      />
      <p role="status" aria-label="link">
        {count}文字
      </p>
      <details open>
        <summary>数え方</summary>
      </details>
      <img src="/logo.svg" alt="" />
      <a href="https://mojisashi.app" rel="noopener">
        mojisashi
      </a>
    </main>
  );
}
