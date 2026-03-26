import { useEffect, useMemo, useState } from "react";
import {
  ativarRede,
  criarRede,
  desativarRede,
  editarRede,
  listarRedes
} from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const estadoInicial = {
  id: "",
  nome_fantasia: "",
  razao_social: "",
  cnpj: "",
  email_contato: "",
  telefone: "",
  valor_implantacao: "",
  valor_mensalidade: "",
  primeiro_cobranca: ""
};

export default function RedesGestaoSecao() {
  const [redes, setRedes] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [modoEdicao, setModoEdicao] = useState(false);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const totalAtivas = useMemo(() => redes.filter((r) => r.ativa).length, [redes]);

  async function carregar() {
    setCarregando(true);
    try {
      const itens = await listarRedes();
      setRedes(itens);
    } catch (err) {
      toastErro(err.message || "Falha ao carregar redes.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function limparFormulario() {
    setForm(estadoInicial);
    setModoEdicao(false);
    setMostrarFormulario(false);
  }

  function preencherEdicao(rede) {
    setForm({
      id: rede.id,
      nome_fantasia: rede.nome_fantasia || "",
      razao_social: rede.razao_social || "",
      cnpj: rede.cnpj || "",
      email_contato: rede.email_contato || "",
      telefone: rede.telefone || "",
      valor_implantacao: rede.valor_implantacao?.toString?.() || "",
      valor_mensalidade: rede.valor_mensalidade?.toString?.() || "",
      primeiro_cobranca: rede.primeiro_cobranca ? rede.primeiro_cobranca.slice(0, 10) : ""
    });
    setModoEdicao(true);
    setMostrarFormulario(true);
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSalvando(true);

    try {
      if (modoEdicao) {
        await editarRede({
          id: form.id,
          nome_fantasia: form.nome_fantasia,
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          email_contato: form.email_contato,
          telefone: form.telefone,
          valor_implantacao: Number(form.valor_implantacao || 0),
          valor_mensalidade: Number(form.valor_mensalidade || 0),
          primeiro_cobranca: form.primeiro_cobranca
        });
        toastSucesso("Rede atualizada com sucesso.");
      } else {
        await criarRede({
          nome_fantasia: form.nome_fantasia,
          razao_social: form.razao_social,
          cnpj: form.cnpj,
          email_contato: form.email_contato,
          telefone: form.telefone,
          valor_implantacao: Number(form.valor_implantacao || 0),
          valor_mensalidade: Number(form.valor_mensalidade || 0),
          primeiro_cobranca: form.primeiro_cobranca
        });
        toastSucesso("Rede criada com sucesso.");
      }
      limparFormulario();
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar rede.");
    } finally {
      setSalvando(false);
    }
  }

  async function alternarStatus(rede) {
    try {
      if (rede.ativa) {
        await desativarRede(rede.id);
        toastSucesso("Rede desativada com sucesso.");
      } else {
        await ativarRede(rede.id);
        toastSucesso("Rede ativada com sucesso.");
      }
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao alterar status da rede.");
    }
  }

  return (
    <div className="secao-redes">
      <div className="secao-redes__topo">
        <p>Total: {redes.length} | Ativas: {totalAtivas}</p>
        <button
          type="button"
          className="botao-primario"
          onClick={() => {
            setModoEdicao(false);
            setForm(estadoInicial);
            setMostrarFormulario((v) => !v);
          }}
        >
          {mostrarFormulario ? "Fechar formulario" : "Adicionar Rede"}
        </button>
      </div>

      {mostrarFormulario ? (
        <form className="form-rede" onSubmit={onSubmit}>
          <div className="form-rede__grid">
            <input
              className="campo__input"
              placeholder="Nome fantasia"
              value={form.nome_fantasia}
              onChange={(e) => setForm((prev) => ({ ...prev, nome_fantasia: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Razao social"
              value={form.razao_social}
              onChange={(e) => setForm((prev) => ({ ...prev, razao_social: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="CNPJ"
              value={form.cnpj}
              onChange={(e) => setForm((prev) => ({ ...prev, cnpj: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Email de contato"
              value={form.email_contato}
              onChange={(e) => setForm((prev) => ({ ...prev, email_contato: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
            />
            <input
              className="campo__input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor da implantacao"
              value={form.valor_implantacao}
              onChange={(e) => setForm((prev) => ({ ...prev, valor_implantacao: e.target.value }))}
            />
            <input
              className="campo__input"
              type="number"
              min="0"
              step="0.01"
              placeholder="Valor da mensalidade"
              value={form.valor_mensalidade}
              onChange={(e) => setForm((prev) => ({ ...prev, valor_mensalidade: e.target.value }))}
            />
            <input
              className="campo__input"
              type="date"
              value={form.primeiro_cobranca}
              onChange={(e) => setForm((prev) => ({ ...prev, primeiro_cobranca: e.target.value }))}
            />
          </div>

          <div className="form-rede__acoes">
            <button className="botao-primario" type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : modoEdicao ? "Salvar Edicao" : "Criar Rede"}
            </button>
            <button type="button" className="botao-secundario" onClick={limparFormulario}>
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {carregando ? (
        <p className="secao-redes__carregando">Carregando redes...</p>
      ) : (
        <div className="tabela-wrap">
          <table className="tabela-redes">
            <thead>
              <tr>
                <th>Rede</th>
                <th>CNPJ</th>
                <th>Contato</th>
                <th>Implantacao</th>
                <th>Mensalidade</th>
                <th>Primeira cobranca</th>
                <th>Status</th>
                <th>Acoes</th>
              </tr>
            </thead>
            <tbody>
              {redes.map((rede) => (
                <tr key={rede.id}>
                  <td>
                    <strong>{rede.nome_fantasia}</strong>
                    <div className="tabela-redes__sub">{rede.razao_social}</div>
                  </td>
                  <td>{rede.cnpj}</td>
                  <td>
                    <div>{rede.email_contato || "-"}</div>
                    <div className="tabela-redes__sub">{rede.telefone || "-"}</div>
                  </td>
                  <td>R$ {Number(rede.valor_implantacao || 0).toFixed(2)}</td>
                  <td>R$ {Number(rede.valor_mensalidade || 0).toFixed(2)}</td>
                  <td>{rede.primeiro_cobranca ? String(rede.primeiro_cobranca).slice(0, 10) : "-"}</td>
                  <td>
                    <span className={`tag-status ${rede.ativa ? "tag-status--ativo" : "tag-status--inativo"}`}>
                      {rede.ativa ? "Ativa" : "Inativa"}
                    </span>
                  </td>
                  <td>
                    <div className="tabela-redes__acoes">
                      <button className="botao-secundario" type="button" onClick={() => preencherEdicao(rede)}>
                        Editar
                      </button>
                      <button className="botao-secundario" type="button" onClick={() => alternarStatus(rede)}>
                        {rede.ativa ? "Desativar" : "Ativar"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {redes.length === 0 ? <p>Nenhuma rede cadastrada.</p> : null}
        </div>
      )}
    </div>
  );
}
