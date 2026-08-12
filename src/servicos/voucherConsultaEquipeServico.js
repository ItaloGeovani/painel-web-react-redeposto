import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetch } from "./apiFetch";

function prefixoEquipe() {
  const p = prefixoApiRedeGestorOuGerente();
  if (!p) {
    throw new Error("Disponivel apenas para equipe do posto ou gestor.");
  }
  return p;
}

/** GET — consulta voucher por codigo de resgate. */
export async function consultarVoucherPorCodigo(codigo) {
  const c = encodeURIComponent(String(codigo || "").trim());
  return apiFetch(`${prefixoEquipe()}/vouchers/consultar?codigo=${c}`, { method: "GET" });
}

/** POST — registra uso (e confirma dinheiro se aplicavel). */
export async function baixarVoucherPorCodigo(codigo, idPosto, operador) {
  const body = { codigo: String(codigo || "").trim() };
  if (idPosto) {
    body.id_posto = idPosto;
  }
  if (operador?.codigo) {
    body.operador_codigo = String(operador.codigo).trim();
  }
  if (operador?.senha) {
    body.operador_senha = String(operador.senha);
  }
  return apiFetch(`${prefixoEquipe()}/vouchers/baixar`, {
    method: "POST",
    body: JSON.stringify(body)
  });
}
