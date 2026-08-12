import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => {
  const isDesktop = mode === "desktop";

  return {
    plugins: [react()],
    // Assets relativos no bundle embutido do Tauri.
    base: isDesktop ? "./" : "/",
    server: {
      port: 5173,
      strictPort: true
    },
    clearScreen: false,
    envPrefix: ["VITE_", "TAURI_"]
  };
});
