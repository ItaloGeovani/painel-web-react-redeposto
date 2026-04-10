const URL_API_DEV = "http://localhost:8080";

/**
 * Em producao (build servido pelo mesmo host do backend), URL vazia = mesma origem.
 * Em dev, aponta para o servidor Go local salvo se VITE_API_URL estiver definido.
 */
export const URL_BASE_API = (() => {
  const env = import.meta.env.VITE_API_URL;
  if (env !== undefined && String(env).trim() !== "") {
    return String(env).replace(/\/$/, "");
  }
  if (import.meta.env.DEV) {
    return URL_API_DEV.replace(/\/$/, "");
  }
  return "";
})();

export function montarUrlApi(caminho) {
  const caminhoNormalizado = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return `${URL_BASE_API}${caminhoNormalizado}`;
}
