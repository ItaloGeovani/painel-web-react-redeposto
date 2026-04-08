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
 * Tenta admin geral; se 401, tenta gestor da rede.
 * Mesma tela de login para ambos os perfis.
 */
export async function loginPainel(email, senha) {
  const respostaAdmin = await fetch(montarUrlApi("/v1/admin-geral/dev/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, senha })
  });

  const payloadAdmin = await lerPayload(respostaAdmin);
  if (respostaAdmin.ok) {
    return payloadAdmin;
  }

  if (respostaAdmin.status === 401) {
    const respostaGestor = await fetch(montarUrlApi("/v1/gestor-rede/dev/login"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ email, senha })
    });
    const payloadGestor = await lerPayload(respostaGestor);
    if (respostaGestor.ok) {
      return payloadGestor;
    }
    const mensagem =
      payloadGestor?.erro || payloadAdmin?.erro || "credenciais invalidas";
    throw new Error(mensagem);
  }

  throw new Error(payloadAdmin?.erro || "Falha ao autenticar.");
}
