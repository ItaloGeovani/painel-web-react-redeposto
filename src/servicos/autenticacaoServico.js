import { montarUrlApi } from "../configuracao/apiConfig";
import { mensagemErroAmigavel, mensagemErroHttp } from "../utilitarios/mensagemErroAmigavel";

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

  let resposta;
  try {
    resposta = await fetch(montarUrlApi("/v1/autenticacao/login-painel"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Painel-Web": "1"
      },
      body: JSON.stringify(body)
    });
  } catch (err) {
    throw new Error(mensagemErroAmigavel(err, { contexto: "login" }));
  }

  const payload = await lerPayload(resposta);

  if (!resposta.ok) {
    throw new Error(mensagemErroHttp(resposta, payload, "Falha ao autenticar."));
  }

  return payload;
}
