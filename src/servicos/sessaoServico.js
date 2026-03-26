const CHAVE_SESSAO = "gaspass_sessao";

export function salvarSessao(sessao) {
  localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao));
}

export function carregarSessao() {
  const bruto = localStorage.getItem(CHAVE_SESSAO);
  if (!bruto) {
    return null;
  }

  try {
    return JSON.parse(bruto);
  } catch {
    return null;
  }
}

export function limparSessao() {
  localStorage.removeItem(CHAVE_SESSAO);
  localStorage.removeItem("gaspass_token");
}
