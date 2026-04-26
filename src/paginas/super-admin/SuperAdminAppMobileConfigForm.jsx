import { useCallback, useEffect, useState } from "react";
import { obterConfigAppMobile, salvarConfigAppMobile } from "../../servicos/adminPlataformaServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import { URL_BASE_API } from "../../configuracao/apiConfig";

const estadoInicial = {
  versao_ios: "0.0.0",
  versao_android: "0.0.0",
  url_loja_ios: "",
  url_loja_android: "",
  mensagem_atualizacao: "",
  atualizacao_obrigatoria: false
};

export default function SuperAdminAppMobileConfigForm() {
  const [form, setForm] = useState(estadoInicial);
  const [atualizadoEm, setAtualizadoEm] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const c = await obterConfigAppMobile();
      if (c) {
        setForm({
          versao_ios: c.versao_ios ?? "0.0.0",
          versao_android: c.versao_android ?? "0.0.0",
          url_loja_ios: c.url_loja_ios ?? "",
          url_loja_android: c.url_loja_android ?? "",
          mensagem_atualizacao: c.mensagem_atualizacao ?? "",
          atualizacao_obrigatoria: Boolean(c.atualizacao_obrigatoria)
        });
        setAtualizadoEm(c.atualizado_em ? String(c.atualizado_em) : "");
      }
    } catch (err) {
      toastErro(err.message || "Falha ao carregar versoes dos apps.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const salvo = await salvarConfigAppMobile({
        versao_ios: form.versao_ios,
        versao_android: form.versao_android,
        url_loja_ios: form.url_loja_ios,
        url_loja_android: form.url_loja_android,
        mensagem_atualizacao: form.mensagem_atualizacao,
        atualizacao_obrigatoria: form.atualizacao_obrigatoria
      });
      if (salvo?.atualizado_em) {
        setAtualizadoEm(String(salvo.atualizado_em));
      }
      toastSucesso("Versoes dos apps salvas.");
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const exemploUrl = `${URL_BASE_API}/v1/app/versao?plataforma=ios&versao_instalada=1.0.0`;

  if (carregando) {
    return (
      <article className="card-resumo">
        <p>Carregando versoes dos apps...</p>
      </article>
    );
  }

  return (
    <div className="form-rede form-rede--equipe" style={{ marginTop: 28 }}>
      <h3 className="rede-detalhes__titulo-secao" style={{ marginBottom: 8, fontSize: "1.05rem" }}>
        Apps mobile (iOS e Android)
      </h3>
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Defina a <strong>versao atual</strong> publicada em cada loja. O app instalado compara com o servidor (semver
        recomendado: <code>1.2.3</code>). Se a instalada for menor, a API indica atualizacao e o app pode exibir o
        modal. Cada <strong>rede</strong> pode ter versoes proprias: em <strong>Redes &gt; [rede] &gt; App movel</strong>{" "}
        o administrador cadastra a sobrescrita; sem isso, vale esta configuração global.
      </p>
      <p className="rede-detalhes__ajuda rede-detalhes__ajuda--form" style={{ marginBottom: 12 }}>
        Endpoint publico (sem login): <code style={{ wordBreak: "break-all" }}>{exemploUrl}</code>
        <br />
        Resposta inclui <code>atualizacao_disponivel</code>, <code>instalada_desatualizada</code>,{" "}
        <code>deve_exibir_modal_atualizar</code>, <code>url_loja</code> e <code>mensagem</code>.
      </p>
      {atualizadoEm ? (
        <p className="rede-detalhes__ajuda" style={{ marginBottom: 12, fontSize: 13 }}>
          Ultima atualizacao no servidor: {new Date(atualizadoEm).toLocaleString("pt-BR")}
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="form-rede__grid">
        <input
          className="campo__input"
          placeholder="Versao iOS (ex.: 1.2.0)"
          value={form.versao_ios}
          onChange={(e) => setForm((p) => ({ ...p, versao_ios: e.target.value }))}
          aria-label="Versao iOS"
        />
        <input
          className="campo__input"
          placeholder="Versao Android (ex.: 1.2.0)"
          value={form.versao_android}
          onChange={(e) => setForm((p) => ({ ...p, versao_android: e.target.value }))}
          aria-label="Versao Android"
        />
        <input
          className="campo__input form-rede__input-span2"
          placeholder="URL App Store (opcional)"
          type="url"
          value={form.url_loja_ios}
          onChange={(e) => setForm((p) => ({ ...p, url_loja_ios: e.target.value }))}
          aria-label="URL loja iOS"
        />
        <input
          className="campo__input form-rede__input-span2"
          placeholder="URL Google Play (opcional)"
          type="url"
          value={form.url_loja_android}
          onChange={(e) => setForm((p) => ({ ...p, url_loja_android: e.target.value }))}
          aria-label="URL loja Android"
        />
        <label className="form-rede__radio-linha form-rede__input-span2">
          <input
            type="checkbox"
            checked={form.atualizacao_obrigatoria}
            onChange={(e) => setForm((p) => ({ ...p, atualizacao_obrigatoria: e.target.checked }))}
          />
          Marcar atualizacao como obrigatoria (o app pode bloquear ate atualizar)
        </label>
        <div className="form-rede__input-span2 campanha-descricao-editor-wrap">
          <span className="form-rede__titulo-aux" id="label-app-msg">
            Mensagem para o modal de atualizacao (opcional)
          </span>
          <textarea
            className="campo__input"
            style={{ minHeight: 96, resize: "vertical" }}
            placeholder="Ex.: Nova versao com melhorias de seguranca e performance."
            value={form.mensagem_atualizacao}
            onChange={(e) => setForm((p) => ({ ...p, mensagem_atualizacao: e.target.value }))}
            aria-labelledby="label-app-msg"
          />
        </div>
        <div className="form-rede__acoes form-rede__input-span2">
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar versoes"}
          </button>
        </div>
      </form>
    </div>
  );
}
