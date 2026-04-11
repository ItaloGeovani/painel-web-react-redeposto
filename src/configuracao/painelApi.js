import { PAPEL_FRENTISTA, PAPEL_GERENTE_POSTO, PAPEL_GESTOR_REDE } from "../constantes/papeis";
import { carregarSessao } from "../servicos/sessaoServico";

/**
 * Papel sempre lido da sessao persistida (localStorage), evitando corrida com useEffect:
 * o filho pode rodar buscarMinhaRede antes de qualquer efeito no App — desde que salvarSessao
 * ja tenha sido chamado (fluxo atual do login), o prefixo da API fica correto.
 */
function papelNaSessao() {
  const sessao = carregarSessao();
  return sessao?.usuario?.papel ?? null;
}

export function gestorRedeLogado() {
  return papelNaSessao() === PAPEL_GESTOR_REDE;
}

export function gerentePostoLogado() {
  return papelNaSessao() === PAPEL_GERENTE_POSTO;
}

export function frentistaLogado() {
  return papelNaSessao() === PAPEL_FRENTISTA;
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
