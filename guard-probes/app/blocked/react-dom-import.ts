// stopped-by: local/imports
import { preconnect } from "react-dom";
export const leak = (text: string) => {
  preconnect(`https://${text}.example`);
};
