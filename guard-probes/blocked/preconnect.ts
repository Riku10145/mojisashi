import { preconnect } from "react-dom";

export function send(text: string): void {
  preconnect(`https://${encodeURIComponent(text)}.example.com`);
}
