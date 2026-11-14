import { CountSection } from "./CountSection";

export function App() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-bold tracking-tight text-slate-900">文字数カウント</h1>
      <p className="mt-4 text-slate-600">
        文章の文字数を数えたり、決めた文字数の文章を作ったりする道具です。
      </p>
      <CountSection />
    </main>
  );
}
