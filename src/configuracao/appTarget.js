/** Modo desktop (Tauri PDV) quando build/dev usa `--mode desktop`. */
export const isDesktop = import.meta.env.VITE_APP_TARGET === "desktop";
