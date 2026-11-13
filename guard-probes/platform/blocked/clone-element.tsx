// stopped-by: local/imports
import { cloneElement } from "react";

export const box = cloneElement(<p>box</p>, { style: { color: "red" } });
