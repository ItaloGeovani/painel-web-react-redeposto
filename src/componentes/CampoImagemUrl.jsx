import { useRef, useState } from "react";
import { uploadImagemPainel } from "../servicos/imagemUploadServico";
import { toastSucesso } from "../servicos/toastServico";

const TIPOS_ACEITOS = "image/jpeg,image/png,image/gif,image/webp";

/**
 * Campo URL + botão de upload (ImgBB via backend).
 * @param {{ value: string, onChange: (url: string) => void, placeholder?: string, classNameInput?: string, span2?: boolean, mostrarPrevia?: boolean, rotuloBotaoUpload?: string, toastAoEnviar?: boolean }} props
 */
export default function CampoImagemUrl({
  value,
  onChange,
  placeholder = "URL da imagem (https://...) ou envie um arquivo",
  classNameInput = "campo__input",
  span2 = false,
  mostrarPrevia = true,
  rotuloBotaoUpload = "Escolher imagem",
  toastAoEnviar = true
}) {
  const inputArquivo = useRef(null);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState("");

  async function aoSelecionarArquivo(e) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) {
      return;
    }
    setErro("");
    setEnviando(true);
    try {
      const url = await uploadImagemPainel(arquivo);
      onChange(url);
      if (toastAoEnviar) {
        toastSucesso("Imagem enviada. A URL foi preenchida automaticamente.");
      }
    } catch (err) {
      setErro(err?.message || "Não foi possível enviar a imagem.");
    } finally {
      setEnviando(false);
    }
  }

  const classeLinha = span2 ? "form-rede__input-span2 campo-imagem-url" : "campo-imagem-url";

  return (
    <div className={classeLinha}>
      <div className="campo-imagem-url__linha">
        <input
          className={classNameInput}
          placeholder={placeholder}
          type="url"
          value={value}
          onChange={(e) => {
            setErro("");
            onChange(e.target.value);
          }}
          aria-label="URL da imagem"
        />
        <input
          ref={inputArquivo}
          type="file"
          accept={TIPOS_ACEITOS}
          hidden
          onChange={aoSelecionarArquivo}
        />
        <button
          type="button"
          className="botao-secundario campo-imagem-url__botao"
          disabled={enviando}
          onClick={() => inputArquivo.current?.click()}
        >
          {enviando ? "Enviando…" : rotuloBotaoUpload}
        </button>
      </div>
      {erro ? (
        <p className="campo-imagem-url__erro" role="alert">
          {erro}
        </p>
      ) : null}
      {mostrarPrevia && value ? (
        <div className="campo-imagem-url__previa">
          <img
            src={value}
            alt=""
            loading="lazy"
            onError={(ev) => {
              ev.target.style.display = "none";
            }}
          />
        </div>
      ) : null}
    </div>
  );
}
