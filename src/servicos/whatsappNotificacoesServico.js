import { apiFetch } from "./apiFetch";

const BASE = "/v1/gestor-rede/dev/whatsapp-notificacoes";

export async function buscarWhatsAppNotificacoes() {
  return apiFetch(BASE, { method: "GET" });
}

export async function salvarWhatsAppNotificacoes(payload) {
  return apiFetch(BASE, {
    method: "PUT",
    body: JSON.stringify(payload)
  });
}

export async function enviarTesteWhatsApp() {
  return apiFetch(`${BASE}/test`, { method: "POST", body: "{}" });
}
