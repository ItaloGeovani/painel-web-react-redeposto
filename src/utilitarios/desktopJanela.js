import { isDesktop } from "../configuracao/appTarget";
import {
  PAPEL_FRENTISTA,
  PAPEL_GERENTE_POSTO,
  PAPEL_GESTOR_REDE
} from "../constantes/papeis";

/** Papéis aceitos no app desktop Tauri. */
export const PAPEIS_DESKTOP = new Set([
  PAPEL_FRENTISTA,
  PAPEL_GESTOR_REDE,
  PAPEL_GERENTE_POSTO
]);

export function papelDesktopPermitido(papel) {
  return PAPEIS_DESKTOP.has(papel);
}

const PDV = {
  width: 980,
  height: 760,
  minWidth: 760,
  minHeight: 520
};

const PAINEL = {
  width: 1400,
  height: 900,
  minWidth: 1200,
  minHeight: 720
};

const LOGIN = {
  width: 980,
  height: 720,
  minWidth: 760,
  minHeight: 520
};

async function obterJanela() {
  if (!isDesktop) return null;
  try {
    const { getCurrentWindow } = await import("@tauri-apps/api/window");
    return getCurrentWindow();
  } catch {
    return null;
  }
}

async function aplicarTamanho(win, cfg, { maximizar = false } = {}) {
  const { LogicalSize } = await import("@tauri-apps/api/window");
  try {
    if (await win.isMaximized()) {
      await win.unmaximize();
    }
  } catch {
    /* ignore */
  }
  await win.setMinSize(new LogicalSize(cfg.minWidth, cfg.minHeight));
  await win.setSize(new LogicalSize(cfg.width, cfg.height));
  try {
    await win.center();
  } catch {
    /* ignore */
  }
  if (maximizar) {
    try {
      await win.maximize();
    } catch {
      /* ignore */
    }
  }
}

/**
 * Ajusta tamanho/mínimos da janela conforme o papel (ou tela de login).
 * @param {string|null|undefined} papel
 */
export async function aplicarJanelaPorPapel(papel) {
  const win = await obterJanela();
  if (!win) return;

  if (papel === PAPEL_FRENTISTA) {
    await aplicarTamanho(win, PDV, { maximizar: false });
    return;
  }
  if (papel === PAPEL_GESTOR_REDE || papel === PAPEL_GERENTE_POSTO) {
    await aplicarTamanho(win, PAINEL, { maximizar: true });
    return;
  }
  await aplicarTamanho(win, LOGIN, { maximizar: false });
}

/**
 * Título da janela / document.title por papel.
 * @param {string|null|undefined} papel
 * @param {string} [nomeRede]
 */
export async function aplicarTituloDesktop(papel, nomeRede = "") {
  if (!isDesktop) return;

  const rede = String(nomeRede || "").trim();
  let titulo = "GasPass";
  if (papel === PAPEL_FRENTISTA) {
    titulo = rede && rede !== "GasPass" ? `${rede} PDV` : "GasPass PDV";
  } else if (papel === PAPEL_GESTOR_REDE || papel === PAPEL_GERENTE_POSTO) {
    titulo = rede && rede !== "GasPass" ? `GasPass — ${rede}` : "GasPass";
  }

  document.title = titulo;
  try {
    const win = await obterJanela();
    if (win) await win.setTitle(titulo);
  } catch {
    /* ignore */
  }
}
