// pages/sobre.js
import { $ } from "../lib/dom.js";

export function initSobre() {
  const y = $("year");
  if (y) y.textContent = String(new Date().getFullYear());
}
