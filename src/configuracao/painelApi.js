import { PAPEL_FRENTISTA, PAPEL_GERENTE_POSTO, PAPEL_GESTOR_REDE } from "../constantes/papeis";

let papelAtual = null;

/**
 * Deve ser chamado ao iniciar sessao (ex.: apos login) para rotear APIs /v1/admin vs gestor / gerente / frentista (/v1/.../dev).
 */
export function configurarPainelApi(sessao) {
  papelAtual = sessao?.usuario?.papel ?? null;
}

export function gestorRedeLogado() {
  return papelAtual === PAPEL_GESTOR_REDE;
}

export function gerentePostoLogado() {
  return papelAtual === PAPEL_GERENTE_POSTO;
}

export function frentistaLogado() {
  return papelAtual === PAPEL_FRENTISTA;
}

/** Base do painel por papel (gestor / gerente / frentista); string vazia para admin. */
export function prefixoApiRedeGestorOuGerente() {
  if (gestorRedeLogado()) {
    return "/v1/gestor-rede/dev";
  }
  if (gerentePostoLogado()) {
    return "/v1/gerente-posto/dev";
  }
  if (frentistaLogado()) {
    return "/v1/frentista/dev";
  }
  return "";
}
