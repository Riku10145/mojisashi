// stopped-by: TS2307
import keep from "../../build/helpers/keep.ts?url";
export const leak = () => import(keep);
