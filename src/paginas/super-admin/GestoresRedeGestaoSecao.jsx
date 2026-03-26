import { useEffect, useMemo, useState } from "react";
import { listarRedes } from "../../servicos/redesServico";
import { criarGestorRede, editarGestorRede, listarGestoresRede } from "../../servicos/gestoresServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const estadoInicial = {
  id: "",
  id_rede: "",
  nome: "",
  email: "",
  senha: "",
  confirmar_senha: "",
  telefone: "",
  ativo: true
};

export default function GestoresRedeGestaoSecao() {
  const [redes, setRedes] = useState([]);
  const [gestores, setGestores] = useState([]);
  const [carregandoRedes, setCarregandoRedes] = useState(true);
  const [carregandoGestores, setCarregandoGestores] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(estadoInicial);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);

  const redeSelecionada = useMemo(
    () => redes.find((rede) => rede.id === form.id_rede) || null,
    [redes, form.id_rede]
  );

  useEffect(() => {
    async function carregarRedes() {
      setCarregandoRedes(true);
      try {
        const itens = await listarRedes();
        setRedes(itens);
      } catch (err) {
        toastErro(err.message || "Falha ao carregar redes para vinculo do gestor.");
      } finally {
        setCarregandoRedes(false);
      }
    }

    carregarRedes();
  }, []);

  useEffect(() => {
    async function carregarGestores() {
      setCarregandoGestores(true);
      try {
        const itens = await listarGestoresRede();
        setGestores(itens);
      } catch (err) {
        toastErro(err.message || "Falha ao carregar gestores da rede.");
      } finally {
        setCarregandoGestores(false);
      }
    }

    carregarGestores();
  }, []);

  function onSelecionarRede(idRede) {
    setForm((anterior) => ({
      ...anterior,
      id_rede: idRede
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    setSalvando(true);
    try {
      if (form.id) {
        const payload = {
          id: form.id,
          nome: form.nome,
          email: form.email,
          telefone: form.telefone,
          ativo: form.ativo
        };
        const senha = form.senha.trim();
        const confirmar = form.confirmar_senha.trim();
        if (senha || confirmar) {
          payload.senha = senha;
          payload.confirmar_senha = confirmar;
        }
        const resposta = await editarGestorRede(payload);
        const atualizado = resposta?.gestor;
        if (atualizado) {
          setGestores((anteriores) =>
            anteriores.map((g) => (g.id === atualizado.id ? atualizado : g))
          );
        }
        setForm(estadoInicial);
        setMostrarFormulario(false);
        toastSucesso("Gestor atualizado com sucesso.");
        return;
      }

      const resposta = await criarGestorRede({
        id_rede: form.id_rede,
        nome: form.nome,
        email: form.email,
        senha: form.senha,
        confirmar_senha: form.confirmar_senha,
        telefone: form.telefone
      });

      setGestores((anteriores) => [resposta?.gestor, ...anteriores].filter(Boolean));
      setForm(estadoInicial);
      setMostrarFormulario(false);
      toastSucesso("Gestor da rede criado com sucesso.");
    } catch (err) {
      toastErro(err.message || "Falha ao salvar gestor da rede.");
    } finally {
      setSalvando(false);
    }
  }

  function abrirCriacao() {
    if (mostrarFormulario && !form.id) {
      setMostrarFormulario(false);
      setForm(estadoInicial);
      return;
    }
    setForm(estadoInicial);
    setMostrarFormulario(true);
  }

  function abrirEdicao(gestor) {
    setForm({
      id: gestor.id,
      id_rede: gestor.id_rede || "",
      nome: gestor.nome || "",
      email: gestor.email || "",
      senha: "",
      confirmar_senha: "",
      telefone: gestor.telefone || "",
      ativo: Boolean(gestor.ativo)
    });
    setMostrarFormulario(true);
  }

  return (
    <div className="secao-gestores">
      <div className="secao-redes__topo">
        <p>Cadastre o usuario gestor da rede para acesso ao sistema administrativo.</p>
        <button type="button" className="botao-primario" onClick={abrirCriacao}>
          {mostrarFormulario && !form.id ? "Fechar formulario" : "Adicionar Gestor"}
        </button>
      </div>

      {mostrarFormulario ? (
        <form className="form-rede" onSubmit={onSubmit}>
          {form.id ? <p className="form-rede__titulo-aux">Editando gestor da rede</p> : null}
          <div className="form-rede__grid">
            {form.id ? (
              <div className="campo__input campo__input--estatico">
                Rede:{" "}
                {redes.find((r) => r.id === form.id_rede)?.nome_fantasia || form.id_rede || "—"}
              </div>
            ) : (
              <select
                className="campo__input"
                value={form.id_rede}
                onChange={(e) => onSelecionarRede(e.target.value)}
                disabled={carregandoRedes}
              >
                <option value="">{carregandoRedes ? "Carregando redes..." : "Selecione a rede"}</option>
                {redes.map((rede) => (
                  <option key={rede.id} value={rede.id}>
                    {rede.nome_fantasia} ({rede.cnpj})
                  </option>
                ))}
              </select>
            )}

            <input
              className="campo__input"
              placeholder="Nome do gestor"
              value={form.nome}
              onChange={(e) => setForm((anterior) => ({ ...anterior, nome: e.target.value }))}
            />
            <input
              className="campo__input"
              type="email"
              placeholder="Email do gestor"
              value={form.email}
              onChange={(e) => setForm((anterior) => ({ ...anterior, email: e.target.value }))}
            />
            {form.id ? (
              <>
                <input
                  className="campo__input"
                  type="password"
                  placeholder="Nova senha (opcional)"
                  autoComplete="new-password"
                  value={form.senha}
                  onChange={(e) => setForm((anterior) => ({ ...anterior, senha: e.target.value }))}
                />
                <input
                  className="campo__input"
                  type="password"
                  placeholder="Confirmar nova senha"
                  autoComplete="new-password"
                  value={form.confirmar_senha}
                  onChange={(e) => setForm((anterior) => ({ ...anterior, confirmar_senha: e.target.value }))}
                />
                <p className="form-rede__dica-senha">Deixe em branco para manter a senha atual.</p>
              </>
            ) : (
              <>
                <input
                  className="campo__input"
                  type="password"
                  placeholder="Senha do gestor"
                  value={form.senha}
                  onChange={(e) => setForm((anterior) => ({ ...anterior, senha: e.target.value }))}
                />
                <input
                  className="campo__input"
                  type="password"
                  placeholder="Repetir senha"
                  value={form.confirmar_senha}
                  onChange={(e) => setForm((anterior) => ({ ...anterior, confirmar_senha: e.target.value }))}
                />
              </>
            )}
            <input
              className="campo__input"
              placeholder="Telefone do gestor"
              value={form.telefone}
              onChange={(e) => setForm((anterior) => ({ ...anterior, telefone: e.target.value }))}
            />
            {form.id ? (
              <label className="form-rede__checkbox-linha">
                <input
                  type="checkbox"
                  checked={form.ativo}
                  onChange={(e) => setForm((anterior) => ({ ...anterior, ativo: e.target.checked }))}
                />
                <span>Gestor ativo</span>
              </label>
            ) : null}
          </div>

          <div className="form-rede__acoes">
            <button
              className="botao-primario"
              type="submit"
              disabled={salvando || (!form.id && carregandoRedes)}
            >
              {salvando ? "Salvando..." : form.id ? "Salvar alteracoes" : "Criar Gestor"}
            </button>
            <button
              className="botao-secundario"
              type="button"
              onClick={() => {
                setForm(estadoInicial);
                setMostrarFormulario(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      {mostrarFormulario && !form.id && redeSelecionada ? (
        <div className="card-referencia">
          <strong>Rede selecionada:</strong> {redeSelecionada.nome_fantasia} | CNPJ {redeSelecionada.cnpj}
        </div>
      ) : null}

      <div className="tabela-wrap">
        <table className="tabela-redes">
          <thead>
            <tr>
              <th>Gestor</th>
              <th>Rede</th>
              <th>Email</th>
              <th>Telefone</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {gestores.map((gestor) => (
              <tr key={gestor.id}>
                <td>
                  <span className="tabela-celula__principal">{gestor.nome}</span>
                </td>
                <td>{redes.find((r) => r.id === gestor.id_rede)?.nome_fantasia || gestor.id_rede}</td>
                <td>{gestor.email || "-"}</td>
                <td>{gestor.telefone || "-"}</td>
                <td>
                  <span className={`tag-status ${gestor.ativo ? "tag-status--ativo" : "tag-status--inativo"}`}>
                    {gestor.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td>
                  <div className="tabela-redes__acoes">
                    <button
                      type="button"
                      className="tabela-btn tabela-btn--acento"
                      onClick={() => abrirEdicao(gestor)}
                    >
                      Editar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!carregandoGestores && gestores.length === 0 ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={6}>Nenhum gestor cadastrado.</td>
              </tr>
            ) : null}
            {carregandoGestores ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={6}>Carregando gestores...</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
