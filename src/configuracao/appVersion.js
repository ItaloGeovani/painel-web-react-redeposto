import pkg from "../../package.json";

/** Versão do painel / PDV (sincronizada no build:release). */
export const APP_VERSION = String(pkg.version || "0.1.0");

export function isTauriApp() {
  return typeof window !== "undefined" && Boolean(window.__TAURI_INTERNALS__ || window.__TAURI__);
}
