import { useCallback, useEffect, useState } from "react";
import { obterConfigAppMobileRede, salvarConfigAppMobileRede } from "../../servicos/adminPlataformaServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import { URL_BASE_API } from "../../configuracao/apiConfig";

const estadoVazio = (base) => ({
  versao_ios: base?.versao_ios ?? "0.0.0",
  versao_android: base?.versao_android ?? "0.0.0",
  url_loja_ios: base?.url_loja_ios ?? "",
  url_loja_android: base?.url_loja_android ?? "",
  mensagem_atualizacao: base?.mensagem_atualizacao ?? "",
  atualizacao_obrigatoria: Boolean(base?.atualizacao_obrigatoria)
});

export default function AbaAppMovelRede({ redeId, nomeRede }) {
  const [form, setForm] = useState(() => estadoVazio(null));
  const [global, setGlobal] = useState(null);
  const [possuiSobrescritura, setPossuiSobrescritura] = useState(false);
  const [atualizadoEm, setAtualizadoEm] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    if (!redeId) {
      return;
    }
    setCarregando(true);
    try {
      const { configuracaoRede, possuiSobrescritura: sob, configuracaoGlobal } = await obterConfigAppMobileRede(redeId);
      setGlobal(configuracaoGlobal);
      setPossuiSobrescritura(sob);
      const base = sob && configuracaoRede ? configuracaoRede : configuracaoGlobal;
      setForm(estadoVazio(base));
      if (sob && configuracaoRede?.atualizado_em) {
        setAtualizadoEm(String(configuracaoRede.atualizado_em));
      } else {
        setAtualizadoEm("");
      }
    } catch (err) {
      toastErro(err.message || "Falha ao carregar versoes do app desta rede.");
    } finally {
      setCarregando(false);
    }
  }, [redeId]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!redeId) {
      return;
    }
    setSalvando(true);
    try {
      const { configuracaoRede: salvo } = await salvarConfigAppMobileRede({
        id_rede: redeId,
        versao_ios: form.versao_ios,
        versao_android: form.versao_android,
        url_loja_ios: form.url_loja_ios,
        url_loja_android: form.url_loja_android,
        mensagem_atualizacao: form.mensagem_atualizacao,
        atualizacao_obrigatoria: form.atualizacao_obrigatoria
      });
      setPossuiSobrescritura(true);
      if (salvo?.atualizado_em) {
        setAtualizadoEm(String(salvo.atualizado_em));
      }
      toastSucesso("Versoes do app desta rede salvas.");
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  const exemploUrl = `${URL_BASE_API}/v1/app/versao?plataforma=android&versao_instalada=1.0.0&id_rede=${encodeURIComponent(
    String(redeId || "")
  )}`;

  if (carregando) {
    return <p className="rede-detalhes__ajuda">Carregando configuracoes do app movel...</p>;
  }

  return (
    <div className="form-rede form-rede--equipe" style={{ marginTop: 8 }}>
      <h3 className="rede-detalhes__titulo-secao" style={{ marginBottom: 8, fontSize: "1.05rem" }}>
        App movel (Android / iOS) — {nomeRede || "rede"}
      </h3>
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
        Cada <strong>build do app de cliente</strong> (marca) envia o <code>id_rede</code> do projeto. Aqui fica a
        versao de referencia e o link da loja <strong>desta rede</strong>. Enquanto nao salvar, o app usara a
        configuração <strong>global</strong> (Configuracoes do Sistema) — valores abaixo comecam a partir
        {possuiSobrescritura ? " do que esta cadastrado para esta rede." : " do global, ate voce salvar."}
      </p>
      {global ? (
        <p className="rede-detalhes__ajuda" style={{ marginBottom: 8, fontSize: 13 }}>
          Referencia global: Android {global.versao_android ?? "—"} &middot; iOS {global.versao_ios ?? "—"}
        </p>
      ) : null}
      <p className="rede-detalhes__ajuda rede-detalhes__ajuda--form" style={{ marginBottom: 8 }}>
        Teste: <code style={{ wordBreak: "break-all" }}>{exemploUrl}</code>
      </p>
      {possuiSobrescritura && atualizadoEm ? (
        <p className="rede-detalhes__ajuda" style={{ marginBottom: 8, fontSize: 13 }}>
          Ultima alteracao (sobrescrita desta rede): {new Date(atualizadoEm).toLocaleString("pt-BR")}
        </p>
      ) : !possuiSobrescritura ? (
        <p className="rede-detalhes__ajuda" style={{ marginBottom: 8, fontSize: 13, fontStyle: "italic" }}>
          Ainda nao ha registro so para esta rede; o app com <code>id_rede</code> usara a configuracao global.
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
          Atualizacao obrigatoria para o app desta rede
        </label>
        <div className="form-rede__input-span2 campanha-descricao-editor-wrap">
          <span className="form-rede__titulo-aux" id="label-app-msg-rede">
            Mensagem no modal (opcional)
          </span>
          <textarea
            className="campo__input"
            style={{ minHeight: 88, resize: "vertical" }}
            value={form.mensagem_atualizacao}
            onChange={(e) => setForm((p) => ({ ...p, mensagem_atualizacao: e.target.value }))}
            aria-labelledby="label-app-msg-rede"
          />
        </div>
        <div className="form-rede__acoes form-rede__input-span2">
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar para esta rede"}
          </button>
        </div>
      </form>
    </div>
  );
}
