const URL_API_PADRAO = "http://localhost:8080";

export const URL_BASE_API = (
  import.meta.env.VITE_API_URL || URL_API_PADRAO
).replace(/\/$/, "");

export function montarUrlApi(caminho) {
  const caminhoNormalizado = caminho.startsWith("/") ? caminho : `/${caminho}`;
  return `${URL_BASE_API}${caminhoNormalizado}`;
}
