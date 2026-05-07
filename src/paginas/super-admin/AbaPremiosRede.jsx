import { useEffect, useState } from "react";
import { criarPremioRede, editarPremioRede, listarPremiosRede } from "../../servicos/premiosServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import { datetimeLocalParaIso, isoParaDatetimeLocal } from "../../util/dataHoraLocal";
import CampoComAjuda, { TooltipInfo } from "../../componentes/CampoComAjuda";

const estadoInicialPremio = {
  titulo: "",
  imagem_url: "",
  valor_moeda: "",
  ativo: true,
  vigencia_inicio: "",
  vigencia_fim: "",
  sem_fim: true,
  quantidade: ""
};

function formatarDataCurta(iso) {
  if (!iso) {
    return "—";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "—";
  }
  return d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
}

export default function AbaPremiosRede({ redeId }) {
  const [premios, setPremios] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [form, setForm] = useState(estadoInicialPremio);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const itens = await listarPremiosRede(redeId);
      setPremios(itens);
    } catch (err) {
      setPremios([]);
      toastErro(err.message || "Falha ao carregar premios.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, [redeId]);

  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...estadoInicialPremio });
    setMostrarForm(true);
  }

  function abrirEditar(p) {
    setEditandoId(p.id);
    const temFim = Boolean(p.vigencia_fim);
    setForm({
      titulo: p.titulo || "",
      imagem_url: p.imagem_url || "",
      valor_moeda: p.valor_moeda != null ? String(p.valor_moeda) : "",
      ativo: Boolean(p.ativo),
      vigencia_inicio: isoParaDatetimeLocal(p.vigencia_inicio),
      vigencia_fim: isoParaDatetimeLocal(p.vigencia_fim),
      sem_fim: !temFim,
      quantidade: p.quantidade_disponivel != null ? String(p.quantidade_disponivel) : ""
    });
    setMostrarForm(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const vi = datetimeLocalParaIso(form.vigencia_inicio);
    if (!vi) {
      toastErro("Informe o inicio da vigencia.");
      return;
    }
    let vf = null;
    if (!form.sem_fim) {
      const parsed = datetimeLocalParaIso(form.vigencia_fim);
      if (!parsed) {
        toastErro("Informe a data fim ou marque vigencia sem data fim.");
        return;
      }
      vf = parsed;
    }
    const valor = parseFloat(String(form.valor_moeda || "").replace(",", "."));
    if (!String(form.titulo || "").trim()) {
      toastErro("Informe o titulo do premio.");
      return;
    }
    if (!Number.isFinite(valor) || valor <= 0) {
      toastErro("Valor em moeda deve ser maior que zero.");
      return;
    }
    const qtdStr = String(form.quantidade || "").trim();
    let quantidadeDisponivel = null;
    if (qtdStr !== "") {
      const n = parseInt(qtdStr, 10);
      if (Number.isNaN(n) || n < 0) {
        toastErro("Quantidade deve ser vazio (ilimitado) ou inteiro >= 0.");
        return;
      }
      quantidadeDisponivel = n;
    }

    const base = {
      id_rede: redeId,
      titulo: form.titulo.trim(),
      imagem_url: form.imagem_url.trim(),
      valor_moeda: valor,
      ativo: form.ativo,
      vigencia_inicio: vi,
      vigencia_fim: vf,
      quantidade_disponivel: quantidadeDisponivel
    };

    setSalvando(true);
    try {
      if (editandoId) {
        await editarPremioRede({ ...base, id: editandoId });
        toastSucesso("Premio atualizado.");
      } else {
        await criarPremioRede(base);
        toastSucesso("Premio criado.");
      }
      setForm({ ...estadoInicialPremio });
      setEditandoId(null);
      setMostrarForm(false);
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar premio.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <p className="rede-detalhes__ajuda">
        Premios que o cliente pode resgatar trocando <strong>moeda virtual da rede</strong>. Defina custo em moeda,
        vigencia e estoque (vazio = ilimitado). Desative para ocultar sem apagar.
      </p>
      <div className="rede-detalhes__linha-titulo rede-detalhes__linha-titulo--fim">
        <button
          type="button"
          className="botao-primario"
          onClick={() => {
            if (mostrarForm) {
              setMostrarForm(false);
              setEditandoId(null);
              setForm({ ...estadoInicialPremio });
            } else {
              abrirNovo();
            }
          }}
        >
          {mostrarForm ? "Fechar formulario" : "Novo premio"}
        </button>
      </div>

      {mostrarForm ? (
        <form className="form-rede form-rede--equipe" onSubmit={onSubmit}>
          <p className="rede-detalhes__ajuda rede-detalhes__ajuda--form">
            Datas em horario local; a API envia UTC (ISO8601). Imagem: URL https opcional.
          </p>
          <div className="form-rede__grid">
            <CampoComAjuda
              rotulo="Titulo"
              dica="Nome do prêmio exibido ao cliente."
              span2
            >
              <input
                className="campo__input"
                placeholder="Titulo do premio"
                value={form.titulo}
                onChange={(e) => setForm((p) => ({ ...p, titulo: e.target.value }))}
              />
            </CampoComAjuda>
            <CampoComAjuda
              rotulo="Imagem"
              dica="URL pública da imagem do prêmio (http/https)."
              span2
            >
              <input
                className="campo__input"
                placeholder="URL da imagem (https://...)"
                type="url"
                value={form.imagem_url}
                onChange={(e) => setForm((p) => ({ ...p, imagem_url: e.target.value }))}
              />
            </CampoComAjuda>
            <CampoComAjuda
              rotulo="Valor em moeda"
              dica="Quantidade de moeda virtual necessária para resgate."
            >
              <input
                className="campo__input"
                placeholder="Valor em moeda da rede"
                inputMode="decimal"
                value={form.valor_moeda}
                onChange={(e) => setForm((p) => ({ ...p, valor_moeda: e.target.value }))}
              />
            </CampoComAjuda>
            <CampoComAjuda
              rotulo="Quantidade"
              dica="Vazio significa estoque ilimitado."
            >
              <input
                className="campo__input"
                placeholder="Quantidade (vazio = ilimitada)"
                inputMode="numeric"
                value={form.quantidade}
                onChange={(e) => setForm((p) => ({ ...p, quantidade: e.target.value }))}
              />
            </CampoComAjuda>
            <label className="form-rede__checkbox-linha">
              <input
                type="checkbox"
                checked={form.ativo}
                onChange={(e) => setForm((p) => ({ ...p, ativo: e.target.checked }))}
              />
              Premio ativo (visivel para resgate quando dentro da vigencia)
              <TooltipInfo texto="Se desmarcado, o prêmio não aparece para resgate no app." />
            </label>
            <CampoComAjuda
              rotulo="Inicio da vigencia"
              dica="Data/hora local em que o prêmio passa a valer."
            >
              <input
                className="campo__input"
                type="datetime-local"
                value={form.vigencia_inicio}
                onChange={(e) => setForm((p) => ({ ...p, vigencia_inicio: e.target.value }))}
                aria-label="Inicio da vigencia"
              />
            </CampoComAjuda>
            <CampoComAjuda
              rotulo="Fim da vigencia"
              dica="Data/hora local em que o prêmio deixa de valer."
            >
              <input
                className="campo__input"
                type="datetime-local"
                value={form.sem_fim ? "" : form.vigencia_fim}
                onChange={(e) => setForm((p) => ({ ...p, vigencia_fim: e.target.value }))}
                disabled={form.sem_fim}
                aria-label="Fim da vigencia"
              />
            </CampoComAjuda>
            <label className="form-rede__checkbox-linha">
              <input
                type="checkbox"
                checked={form.sem_fim}
                onChange={(e) => setForm((p) => ({ ...p, sem_fim: e.target.checked }))}
              />
              Sem data fim de vigencia
              <TooltipInfo texto="Ao marcar, o prêmio fica sem data limite final." />
            </label>
          </div>
          <div className="form-rede__acoes">
            <button className="botao-primario" type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Criar premio"}
            </button>
          </div>
        </form>
      ) : null}

      <div className="tabela-wrap tabela-wrap--campanhas">
        <table className="tabela-redes tabela-redes--compacta tabela-redes--campanhas-principal">
          <thead>
            <tr>
              <th className="tabela-campanha__col-promo">Premio</th>
              <th>Valor</th>
              <th>Ativo</th>
              <th>Inicio</th>
              <th>Fim</th>
              <th>Qtd</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {premios.map((p) => (
              <tr key={p.id}>
                <td className="tabela-campanha__col-promo">
                  <div className="tabela-premio__titulo-linha">
                    {p.imagem_url ? (
                      <img src={p.imagem_url} alt="" className="tabela-logo-thumb" loading="lazy" />
                    ) : (
                      <span className="tabela-premio__sem-img">—</span>
                    )}
                    <span className="tabela-celula__principal">{p.titulo}</span>
                  </div>
                </td>
                <td className="tabela-num">{p.valor_moeda}</td>
                <td>{p.ativo ? "Sim" : "Nao"}</td>
                <td>{formatarDataCurta(p.vigencia_inicio)}</td>
                <td>{p.vigencia_fim ? formatarDataCurta(p.vigencia_fim) : "—"}</td>
                <td className="tabela-num">
                  {p.quantidade_disponivel != null ? p.quantidade_disponivel : "∞"}
                </td>
                <td>
                  <button type="button" className="tabela-btn" onClick={() => abrirEditar(p)}>
                    Editar
                  </button>
                </td>
              </tr>
            ))}
            {!carregando && premios.length === 0 ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={7}>Nenhum premio cadastrado.</td>
              </tr>
            ) : null}
            {carregando ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={7}>Carregando premios...</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}
