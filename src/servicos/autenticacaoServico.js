import { montarUrlApi } from "../configuracao/apiConfig";

export async function loginAdministrador(email, senha) {
  const resposta = await fetch(montarUrlApi("/v1/admin-geral/dev/login"), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ email, senha })
  });

  const payload = await resposta.json().catch(() => ({}));

  if (!resposta.ok) {
    const mensagem = payload?.erro || "Falha ao autenticar.";
    throw new Error(mensagem);
  }

  return payload;
}
