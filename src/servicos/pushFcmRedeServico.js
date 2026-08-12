import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

/**
 * Envia notificacao de teste a todos os clientes (apps com token) da rede.
 * @param {{ titulo?: string, corpo?: string }} payload
 */
export async function enviarTesteDePushRede({ titulo = "", corpo = "" } = {}) {
  const prefixo = prefixoApiRedeGestorOuGerente();
  if (!prefixo) {
    throw new Error("Apenas gestor da rede ou gerente de posto podem testar o push (menu Configuracoes).");
  }
  const url = `${prefixo}/push/fcm/rede/teste`;
  const payload = await apiFetch(url, {
    method: "POST",
    body: JSON.stringify({
      titulo: String(titulo || "").trim(),
      corpo: String(corpo || "").trim()
    })
  });
  return {
    ok: true,
    enviados: payload?.enviados ?? 0,
    falhas: payload?.falhas ?? 0,
    tokensTentado: payload?.tokens_tentado ?? 0
  };
}

/**
 * GET diagnostico FCM da rede da sessao: contagens de tokens, se FCM_SA esta configurado no servidor, etc.
 */
export async function buscarDiagnosticoPushRede() {
  const prefixo = prefixoApiRedeGestorOuGerente();
  if (!prefixo) {
    throw new Error("Apenas gestor da rede ou gerente de posto podem ver o diagnostico push.");
  }
  return apiFetch(`${prefixo}/push/diagnostico`, { method: "GET" });
}
