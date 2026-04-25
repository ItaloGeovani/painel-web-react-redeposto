import { useEffect, useState } from "react";
import {
  criarCombustivelRede,
  editarCombustivelRede,
  excluirCombustivelRede,
  listarCombustiveisRede
} from "../../servicos/combustiveisRedeServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const formVazio = {
  nome: "",
  codigo: "",
  descricao: "",
  preco_por_litro: "",
  ordem: "0",
  ativo: true
};

function formatarBrl(n) {
  if (n == null || n === "" || !Number.isFinite(Number(n))) {
    return "—";
  }
  return Number(n).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

export default function CombustiveisRedeSecao() {
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [form, setForm] = useState(formVazio);
  const [editandoId, setEditandoId] = useState(null);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);

  async function carregar() {
    setCarregando(true);
    try {
      const lista = await listarCombustiveisRede();
      setItens(lista);
    } catch (err) {
      setItens([]);
      toastErro(err.message || "Falha ao carregar combustiveis.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function abrirNovo() {
    setEditandoId(null);
    setForm({ ...formVazio });
    setMostrarForm(true);
  }

  function abrirEditar(c) {
    setEditandoId(c.id);
    setForm({
      nome: c.nome || "",
      codigo: c.codigo || "",
      descricao: c.descricao || "",
      preco_por_litro: c.preco_por_litro != null ? String(c.preco_por_litro).replace(".", ",") : "",
      ordem: c.ordem != null ? String(c.ordem) : "0",
      ativo: Boolean(c.ativo)
    });
    setMostrarForm(true);
  }

  async function onSubmit(e) {
    e.preventDefault();
    const nome = String(form.nome || "").trim();
    if (!nome) {
      toastErro("Informe o nome do combustivel.");
      return;
    }
    const preco = parseFloat(String(form.preco_por_litro || "").replace(/\./g, "").replace(",", "."));
    if (!Number.isFinite(preco) || preco < 0) {
      toastErro("Preco por litro deve ser um numero (ex.: 5,89).");
      return;
    }
    const ordem = parseInt(String(form.ordem || "0"), 10);
    if (!Number.isFinite(ordem)) {
      toastErro("Ordem invalida.");
      return;
    }
    const payload = {
      nome,
      codigo: String(form.codigo || "").trim(),
      descricao: String(form.descricao || "").trim(),
      preco_por_litro: preco,
      ordem,
      ativo: form.ativo
    };
    setSalvando(true);
    try {
      if (editandoId) {
        await editarCombustivelRede({ id: editandoId, ...payload });
        toastSucesso("Combustivel atualizado.");
      } else {
        await criarCombustivelRede(payload);
        toastSucesso("Combustivel cadastrado.");
      }
      setMostrarForm(false);
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  async function onExcluir(c) {
    const ok = window.confirm(
      `Excluir "${c.nome}"? Essa acao nao pode ser desfeita.`
    );
    if (!ok) {
      return;
    }
    try {
      await excluirCombustivelRede(c.id);
      toastSucesso("Combustivel excluido.");
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao excluir.");
    }
  }

  return (
    <div className="combustiveis-rede-secao">
      <p className="rede-detalhes__ajuda">
        Cadastre os combustiveis ofertados na rede e o <strong>preco atual por litro</strong> (referencia para
        precificacao e outras funcionalidades). Gestor e gerente de posto podem editar.
      </p>
      <div className="rede-detalhes__linha-titulo" style={{ marginBottom: 12 }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Lista</h2>
        <button type="button" className="botao-primario" onClick={abrirNovo}>
          Novo combustivel
        </button>
      </div>

      {carregando ? (
        <p className="rede-detalhes__ajuda">Carregando...</p>
      ) : itens.length === 0 ? (
        <p className="rede-detalhes__ajuda">Nenhum combustivel cadastrado ainda.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="tabela-redes tabela-redes--compacta tabela-redes--campanhas-principal">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Codigo</th>
                <th>Preço / L</th>
                <th>Ordem</th>
                <th>Ativo</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {itens.map((c) => (
                <tr key={c.id}>
                  <td>
                    <strong>{c.nome}</strong>
                    {c.descricao ? (
                      <div className="rede-detalhes__ajuda" style={{ marginTop: 4, maxWidth: 280 }}>
                        {c.descricao}
                      </div>
                    ) : null}
                  </td>
                  <td>{c.codigo || "—"}</td>
                  <td>{formatarBrl(c.preco_por_litro)}</td>
                  <td>{c.ordem ?? 0}</td>
                  <td>{c.ativo ? "Sim" : "Nao"}</td>
                  <td>
                    <button type="button" className="tabela-btn" onClick={() => abrirEditar(c)}>
                      Editar
                    </button>{" "}
                    <button type="button" className="tabela-btn" onClick={() => onExcluir(c)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {mostrarForm ? (
        <div className="card-resumo" style={{ marginTop: 20 }}>
          <h3 style={{ marginTop: 0, fontSize: "1.05rem" }}>{editandoId ? "Editar combustivel" : "Novo combustivel"}</h3>
          <form className="form-rede form-rede--equipe" onSubmit={onSubmit}>
            <div className="form-rede__grid">
              <input
                className="campo__input form-rede__input-span2"
                placeholder="Nome (ex.: Gasolina comum)"
                value={form.nome}
                onChange={(e) => setForm((f) => ({ ...f, nome: e.target.value }))}
                required
                aria-label="Nome"
              />
              <input
                className="campo__input"
                placeholder="Codigo (opcional, unico na rede)"
                value={form.codigo}
                onChange={(e) => setForm((f) => ({ ...f, codigo: e.target.value }))}
                aria-label="Codigo"
              />
              <input
                className="campo__input"
                placeholder="Ordem (exibicao)"
                value={form.ordem}
                onChange={(e) => setForm((f) => ({ ...f, ordem: e.target.value }))}
                inputMode="numeric"
                aria-label="Ordem"
              />
              <input
                className="campo__input form-rede__input-span2"
                placeholder="Descricao (opcional)"
                value={form.descricao}
                onChange={(e) => setForm((f) => ({ ...f, descricao: e.target.value }))}
                aria-label="Descricao"
              />
              <input
                className="campo__input"
                placeholder="Preco por litro (R$)"
                value={form.preco_por_litro}
                onChange={(e) => setForm((f) => ({ ...f, preco_por_litro: e.target.value }))}
                inputMode="decimal"
                required
                aria-label="Preco por litro"
              />
              <label className="form-rede__checkbox-linha form-rede__input-span2">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((f) => ({ ...f, ativo: e.target.checked }))}
                />
                Ativo
              </label>
            </div>
            <div className="form-rede__acoes">
              <button className="botao-secundario" type="button" onClick={() => setMostrarForm(false)} disabled={salvando}>
                Cancelar
              </button>
              <button className="botao-primario" type="submit" disabled={salvando}>
                {salvando ? "Salvando..." : "Salvar"}
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}
