const URL_API_DEV = "http://localhost:8080";
const isDesktop = import.meta.env.VITE_APP_TARGET === "desktop";

/**
 * Em producao web (build servido pelo mesmo host do backend), URL vazia = mesma origem.
 * Em dev ou desktop (Tauri), exige URL absoluta — same-origin nao existe no WebView.
 */
export const URL_BASE_API = (() => {
  const env = import.meta.env.VITE_API_URL;
  if (env !== undefined && String(env).trim() !== "") {
    return String(env).replace(/\/$/, "");
  }
  if (import.meta.env.DEV || isDesktop) {
    return URL_API_DEV.replace(/\/$/, "");
  }
  return "";
})();

export function montarUrlApi(caminho) {
  const caminhoNormalizado = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return `${URL_BASE_API}${caminhoNormalizado}`;
}
