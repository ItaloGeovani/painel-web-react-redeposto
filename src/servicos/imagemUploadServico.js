import { montarUrlApi } from "../configuracao/apiConfig";
import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { limparSessao } from "./sessaoServico";

function caminhoUploadImagem() {
  const prefixo = prefixoApiRedeGestorOuGerente();
  return prefixo ? `${prefixo}/upload-imagem` : "/v1/admin/upload-imagem";
}

/**
 * Envia arquivo ao backend (ImgBB). Retorna URL HTTPS pública.
 * @param {File} arquivo
 * @returns {Promise<string>}
 */
export async function uploadImagemPainel(arquivo) {
  if (!arquivo || !(arquivo instanceof File)) {
    throw new Error("Selecione um arquivo de imagem.");
  }

  const token = localStorage.getItem("gaspass_token");
  const form = new FormData();
  form.append("file", arquivo);

  const resposta = await fetch(montarUrlApi(caminhoUploadImagem()), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    },
    body: form
  });

  const payload = await resposta.json().catch(() => ({}));
  if (!resposta.ok) {
    const mensagemErro = payload?.erro || "Falha no upload da imagem.";
    const texto = String(mensagemErro || "").toLowerCase();
    if (
      resposta.status === 401 &&
      (texto.includes("token invalido") || texto.includes("sessao expirada") || texto.includes("token ausente"))
    ) {
      limparSessao();
      window.dispatchEvent(
        new CustomEvent("gaspass:sessao-expirada", {
          detail: { mensagem: mensagemErro }
        })
      );
    }
    throw new Error(mensagemErro);
  }

  const url = String(payload?.url || "").trim();
  if (!url) {
    throw new Error("Upload concluído sem URL retornada.");
  }
  return url;
}
