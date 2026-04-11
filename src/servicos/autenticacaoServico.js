import { montarUrlApi } from "../configuracao/apiConfig";

async function lerPayload(resposta) {
  return resposta.json().catch(() => ({}));
}

/** Login apenas de administrador geral (super_admin). */
export async function loginAdministrador(email, senha) {
  const resposta = await fetch(montarUrlApi("/v1/admin-geral/dev/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, senha })
  });

  const payload = await lerPayload(resposta);

  if (!resposta.ok) {
    const mensagem = payload?.erro || "Falha ao autenticar.";
    throw new Error(mensagem);
  }

  return payload;
}

/** Login de gestor da rede (mesmo formato de resposta do admin: token + sessao). */
export async function loginGestorRede(email, senha) {
  const resposta = await fetch(montarUrlApi("/v1/gestor-rede/dev/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, senha })
  });

  const payload = await lerPayload(resposta);

  if (!resposta.ok) {
    const mensagem = payload?.erro || "Falha ao autenticar.";
    throw new Error(mensagem);
  }

  return payload;
}

/**
 * Login unificado do painel (uma requisicao): servidor tenta admin, gestor e equipe na ordem.
 * Endpoints legados /v1/admin-geral/dev/login e /v1/gestor-rede/dev/login continuam disponiveis.
 */
export async function loginPainel(email, senha) {
  const resposta = await fetch(montarUrlApi("/v1/autenticacao/login-painel"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, senha })
  });

  const payload = await lerPayload(resposta);

  if (!resposta.ok) {
    const mensagem = payload?.erro || "Falha ao autenticar.";
    throw new Error(mensagem);
  }

  return payload;
}
