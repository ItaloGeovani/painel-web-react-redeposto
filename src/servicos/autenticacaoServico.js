import { montarUrlApi } from "../configuracao/apiConfig";

async function lerPayload(resposta) {
  return resposta.json().catch(() => ({}));
}

/**
 * Login unificado do painel: servidor tenta admin, gestor e equipe na ordem.
 * Frentista pode entrar com e-mail+senha (legado) ou codigo+senha.
 */
export async function loginPainel(identificador, senha) {
  const id = String(identificador || "").trim();
  const body = { senha: String(senha || "") };
  if (id.includes("@")) {
    body.email = id;
  } else {
    body.codigo = id;
  }

  const resposta = await fetch(montarUrlApi("/v1/autenticacao/login-painel"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Painel-Web": "1"
    },
    body: JSON.stringify(body)
  });

  const payload = await lerPayload(resposta);

  if (!resposta.ok) {
    const mensagem = payload?.erro || "Falha ao autenticar.";
    throw new Error(mensagem);
  }

  return payload;
}
