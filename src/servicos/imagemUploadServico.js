import { prefixoApiRedeGestorOuGerente } from "../configuracao/painelApi";
import { apiFetchFormData } from "./apiFetch";

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

  const form = new FormData();
  form.append("file", arquivo);

  const payload = await apiFetchFormData(caminhoUploadImagem(), form);

  const url = String(payload?.url || "").trim();
  if (!url) {
    throw new Error("Upload concluído sem URL retornada.");
  }
  return url;
}
