import { useCallback, useEffect, useState } from "react";
import { buscarRedesSociaisGestor, salvarRedesSociaisGestor } from "../../servicos/redesSociaisGestorServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const PLATAFORMAS = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "youtube", label: "YouTube" },
  { id: "tiktok", label: "TikTok" },
  { id: "whatsapp", label: "WhatsApp" },
  { id: "x", label: "X (Twitter)" },
  { id: "site", label: "Site / outro link" },
  { id: "outro", label: "Outro (ícone genérico)" }
];

function linhaVazia() {
  return { id: crypto.randomUUID?.() ?? String(Math.random()), plataforma: "instagram", titulo_exibicao: "", url: "" };
}

export default function GestorRedesSociaisSubsecao({ onVoltar }) {
  const [linhas, setLinhas] = useState([linhaVazia()]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const d = await buscarRedesSociaisGestor();
      const arr = Array.isArray(d?.links) ? d.links : [];
      if (arr.length) {
        setLinhas(
          arr.map((row) => ({
            id: crypto.randomUUID?.() ?? String(Math.random()),
            plataforma: String(row.plataforma || "instagram").toLowerCase(),
            titulo_exibicao: row.titulo_exibicao != null ? String(row.titulo_exibicao) : "",
            url: row.url != null ? String(row.url) : ""
          }))
        );
      } else {
        setLinhas([linhaVazia()]);
      }
    } catch (e) {
      toastErro(e?.message || "Falha ao carregar redes sociais.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar]);

  async function onSubmit(ev) {
    ev.preventDefault();
    const links = [];
    for (const L of linhas) {
      const p = String(L.plataforma || "").trim().toLowerCase();
      const tit = String(L.titulo_exibicao || "").trim();
      const u = String(L.url || "").trim();
      if (!p && !tit && !u) continue;
      if (!u) {
        toastErro("Cada linha com título precisa de uma URL (https://…).");
        return;
      }
      links.push({ plataforma: p, titulo_exibicao: tit, url: u });
    }
    setSalvando(true);
    try {
      await salvarRedesSociaisGestor({ links });
      toastSucesso("Redes sociais salvas. O app mostra estas entradas na tela dedicada.");
      await carregar();
    } catch (e) {
      toastErro(e?.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <article className="card-resumo card-resumo--painel-form">
        <p className="rede-detalhes__ajuda">Carregando…</p>
      </article>
    );
  }

  return (
    <article className="card-resumo card-resumo--painel-form">
      <header className="gestor-subsecao__topo">
        <button type="button" className="botao-secundario botao-secundario--compacto" onClick={onVoltar}>
          Voltar
        </button>
        <div>
          <h2 className="gestor-subsecao__titulo">Redes sociais no app</h2>
          <p className="gestor-subsecao__sub">
            Defina quais links aparecem na tela &quot;Redes sociais&quot; do cliente. Título é o texto do botão; URL deve ser
            https (ou http). Ative o módulo na aba Funcionalidades para o atalho aparecer na home.
          </p>
        </div>
      </header>

      <form className="form-rede gire-form" onSubmit={onSubmit}>
        <section className="gire-form__secao">
          <h3 className="gire-form__secao-titulo">Links exibidos</h3>
          <p className="rede-detalhes__ajuda gire-form__ajuda" style={{ marginTop: 0 }}>
            Ordem na lista = ordem na tela do app. Linhas vazias são ignoradas ao salvar.
          </p>
          <div className="gire-form__jackpot-cabecalho" style={{ gridTemplateColumns: "minmax(120px, 1fr) 1fr 1.2fr auto" }}>
            <span>Rede</span>
            <span>Título no app</span>
            <span>URL</span>
            <span />
          </div>
          <div className="gire-form__jackpot-lista">
            {linhas.map((L) => (
              <div
                key={L.id}
                className="gire-form__jackpot-linha"
                style={{ gridTemplateColumns: "minmax(120px, 1fr) 1fr 1.2fr auto" }}
              >
                <select
                  className="form-rede__input"
                  value={L.plataforma}
                  onChange={(e) => setLinhas((rows) => rows.map((r) => (r.id === L.id ? { ...r, plataforma: e.target.value } : r)))}
                >
                  {PLATAFORMAS.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
                <input
                  className="form-rede__input"
                  type="text"
                  placeholder="Ex.: Siga no Instagram"
                  value={L.titulo_exibicao}
                  onChange={(e) => setLinhas((rows) => rows.map((r) => (r.id === L.id ? { ...r, titulo_exibicao: e.target.value } : r)))}
                />
                <input
                  className="form-rede__input"
                  type="url"
                  placeholder="https://instagram.com/…"
                  value={L.url}
                  onChange={(e) => setLinhas((rows) => rows.map((r) => (r.id === L.id ? { ...r, url: e.target.value } : r)))}
                />
                <button
                  type="button"
                  className="botao-secundario botao-secundario--compacto"
                  onClick={() => setLinhas((rows) => (rows.length <= 1 ? rows : rows.filter((r) => r.id !== L.id)))}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          <button type="button" className="botao-secundario botao-secundario--compacto gire-form__adicionar" onClick={() => setLinhas((rows) => [...rows, linhaVazia()])}>
            Adicionar linha
          </button>
        </section>

        <div className="form-rede__acoes" style={{ marginTop: 8 }}>
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? "Salvando…" : "Salvar"}
          </button>
        </div>
      </form>
    </article>
  );
}
