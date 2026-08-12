/**
 * Marca da rede para o PDV desktop (nome + logo).
 * Prioridade do logo: URL da API → fallback local por nome → GasPass.
 */

function baseImg(file) {
  return `${import.meta.env.BASE_URL}img/${file}`;
}

/** Fallbacks locais enquanto a rede não tem logo cadastrado no painel. */
const FALLBACKS_LOCAIS = [
  { match: /lucena/i, file: "logo_lucena.png" }
];

export function nomeRedeDisplay(rede) {
  return String(rede?.nome_fantasia || rede?.nome || "").trim() || "GasPass";
}

export function logoRedeUrl(rede) {
  const api = String(rede?.logo_url || rede?.rede_logo_url || "").trim();
  if (api) return api;

  const nome = nomeRedeDisplay(rede);
  for (const f of FALLBACKS_LOCAIS) {
    if (f.match.test(nome)) return baseImg(f.file);
  }
  return baseImg("logo.png");
}

export function tituloJanelaPdv(rede) {
  const nome = nomeRedeDisplay(rede);
  if (!rede || nome === "GasPass") return "GasPass PDV";
  return `${nome} PDV`;
}

/** Atualiza título do documento, favicon e (se Tauri) título da janela. */
export async function aplicarBrandingPdv(rede) {
  const titulo = tituloJanelaPdv(rede);
  const logo = logoRedeUrl(rede);

  document.title = titulo;

  let link = document.querySelector('link[rel="icon"][data-pdv-brand]');
  if (!link) {
    link = document.createElement("link");
    link.rel = "icon";
    link.setAttribute("data-pdv-brand", "1");
    document.head.appendChild(link);
  }
  link.type = "image/png";
  link.href = logo;

  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    await getCurrentWindow().setTitle(titulo);
  } catch {
    // Browser / sem Tauri: só document.title + favicon.
  }
}
