import { Fragment, useEffect, useMemo, useState } from "react";
import { criarCampanhaRede, editarCampanhaRede, listarCampanhasRede } from "../../servicos/campanhasServico";
import { criarPostoRede, listarPostosRede } from "../../servicos/postosServico";
import { criarUsuarioEquipe, listarUsuariosRede } from "../../servicos/usuariosRedeServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import GestoresRedeGestaoSecao from "./GestoresRedeGestaoSecao";
import CampanhaDescricaoEditor from "../../componentes/CampanhaDescricaoEditor";

const TAMANHO_PAGINA = 10;

const ABAS_REDE = [
  { id: "visao-geral", label: "Visao geral" },
  { id: "gestor", label: "Gestor" },
  { id: "clientes", label: "Clientes" },
  { id: "postos", label: "Postos" },
  { id: "campanhas", label: "Campanhas" },
  { id: "carteira", label: "Carteira" },
  { id: "vouchers", label: "Vouchers" }
];

const estadoInicialEquipe = {
  nome: "",
  email: "",
  telefone: "",
  senha: "",
  confirmar_senha: "",
  papel: "frentista"
};

const estadoInicialPosto = {
  nome: "",
  codigo: "",
  nome_fantasia: "",
  cnpj: "",
  logo_url: "",
  rua: "",
  numero: "",
  bairro: "",
  complemento: "",
  cep: "",
  cidade: "",
  estado: "",
  telefone: "",
  email_contato: ""
};

const estadoInicialCampanha = {
  id: "",
  nome: "",
  titulo: "",
  descricao: "",
  imagem_url: "",
  id_posto: "",
  vigencia_inicio: "",
  vigencia_fim: "",
  status: "ATIVA",
  canal: "app",
  modalidade_desconto: "NENHUM",
  base_desconto: "VALOR_COMPRA",
  valor_desconto: "",
  valor_minimo_compra: "0",
  max_usos_por_cliente: ""
};

function formatarCnpjExibicao(cnpj) {
  const d = String(cnpj || "").replace(/\D/g, "");
  if (d.length !== 14) {
    return cnpj || "";
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

function formatarCepExibicao(cep) {
  const d = String(cep || "").replace(/\D/g, "");
  if (d.length !== 8) {
    return cep || "";
  }
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

function isoParaDatetimeLocal(iso) {
  if (!iso) {
    return "";
  }
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function datetimeLocalParaIso(s) {
  if (!s) {
    return "";
  }
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) {
    return "";
  }
  return d.toISOString();
}

function rotuloStatusCampanha(st) {
  switch (st) {
    case "ATIVA":
      return "Ativa";
    case "PAUSADA":
      return "Pausada";
    case "RASCUNHO":
      return "Rascunho";
    case "ARQUIVADA":
      return "Arquivada";
    default:
      return st;
  }
}

function rotuloCanaisCampanha(c) {
  if (c.valida_no_posto_fisico) {
    return "Posto fisico";
  }
  return "App";
}

function rotuloBaseDesconto(b) {
  switch (b) {
    case "VALOR_COMPRA":
      return "Valor da compra";
    case "LITRO":
      return "Por litro";
    case "UNIDADE":
      return "Por unidade";
    default:
      return b || "—";
  }
}

function resumoDescontoCampanha(c) {
  if (!c.modalidade_desconto || c.modalidade_desconto === "NENHUM") {
    return "Sem desconto";
  }
  const base = rotuloBaseDesconto(c.base_desconto);
  if (c.modalidade_desconto === "PERCENTUAL") {
    return `${c.valor_desconto}% (${base})`;
  }
  if (c.modalidade_desconto === "VALOR_FIXO") {
    return `R$ ${Number(c.valor_desconto).toFixed(2)} (${base})`;
  }
  return "—";
}

function rotuloLimiteUsosCampanha(c) {
  if (c.max_usos_por_cliente == null) {
    return "Ilimitado ate o fim";
  }
  if (c.max_usos_por_cliente === 1) {
    return "1x por cliente";
  }
  return `${c.max_usos_por_cliente}x por cliente`;
}

function rotuloPapel(p) {
  switch (p) {
    case "gerente_posto":
      return "Gerente de posto";
    case "frentista":
      return "Frentista";
    case "cliente":
      return "Cliente";
    case "gestor_rede":
      return "Gestor da rede";
    default:
      return p;
  }
}

function ListaUsuariosRedePaginada({ redeId, papeis, idPosto, refreshKey = 0 }) {
  const [pagina, setPagina] = useState(1);
  const [total, setTotal] = useState(0);
  const [itens, setItens] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    setPagina(1);
  }, [redeId, papeis, idPosto, refreshKey]);

  useEffect(() => {
    let cancelado = false;
    async function carregar() {
      setCarregando(true);
      const offset = (pagina - 1) * TAMANHO_PAGINA;
      try {
        const opcoes = {
          limite: TAMANHO_PAGINA,
          offset,
          papeis
        };
        if (idPosto) {
          opcoes.id_posto = idPosto;
        }
        const res = await listarUsuariosRede(redeId, opcoes);
        if (!cancelado) {
          setItens(res.itens);
          setTotal(res.total);
        }
      } catch (err) {
        if (!cancelado) {
          toastErro(err.message || "Falha ao carregar usuarios.");
          setItens([]);
          setTotal(0);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    }
    carregar();
    return () => {
      cancelado = true;
    };
  }, [redeId, papeis, idPosto, pagina, refreshKey]);

  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));
  const offsetAtual = (pagina - 1) * TAMANHO_PAGINA;
  const inicioExibido = total === 0 ? 0 : offsetAtual + 1;
  const fimExibido = offsetAtual + itens.length;

  return (
    <div className="rede-detalhes__subsecao">
      <div className="tabela-wrap">
        <table className="tabela-redes tabela-redes--compacta">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Papel</th>
              <th>Email</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {itens.map((u) => (
              <tr key={u.id}>
                <td>
                  <span className="tabela-celula__principal">{u.nome}</span>
                </td>
                <td>{rotuloPapel(u.papel)}</td>
                <td>{u.email || "—"}</td>
                <td>
                  <span className={`tag-status ${u.ativo ? "tag-status--ativo" : "tag-status--inativo"}`}>
                    {u.ativo ? "Ativo" : "Inativo"}
                  </span>
                </td>
              </tr>
            ))}
            {!carregando && itens.length === 0 ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={4}>Nenhum usuario nesta categoria.</td>
              </tr>
            ) : null}
            {carregando ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={4}>Carregando...</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
      <div className="paginacao-rede">
        <span className="paginacao-rede__info">
          {carregando ? "Carregando..." : `Exibindo ${inicioExibido}–${fimExibido} de ${total}`}
        </span>
        <div className="paginacao-rede__botoes">
          <button
            type="button"
            className="botao-secundario botao-secundario--compacto"
            disabled={carregando || pagina <= 1}
            onClick={() => setPagina((p) => Math.max(1, p - 1))}
          >
            Anterior
          </button>
          <span className="paginacao-rede__pagina">
            Pagina {pagina} / {totalPaginas}
          </span>
          <button
            type="button"
            className="botao-secundario botao-secundario--compacto"
            disabled={carregando || pagina >= totalPaginas}
            onClick={() => setPagina((p) => p + 1)}
          >
            Proxima
          </button>
        </div>
      </div>
    </div>
  );
}

function SecaoEquipePosto({ redeId, idPosto, nomePosto, onVoltar }) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState(estadoInicialEquipe);

  async function onSubmitEquipe(event) {
    event.preventDefault();
    setSalvando(true);
    try {
      await criarUsuarioEquipe({
        id_rede: redeId,
        id_posto: idPosto,
        nome: form.nome,
        email: form.email,
        telefone: form.telefone,
        senha: form.senha,
        confirmar_senha: form.confirmar_senha,
        papel: form.papel
      });
      toastSucesso("Usuario da equipe criado com sucesso.");
      setForm(estadoInicialEquipe);
      setMostrarForm(false);
      setRefreshKey((k) => k + 1);
    } catch (err) {
      toastErro(err.message || "Falha ao criar usuario da equipe.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <div className="rede-detalhes__subnivel">
        <button type="button" className="botao-secundario rede-detalhes__voltar" onClick={onVoltar}>
          Voltar aos postos
        </button>
        <p className="rede-detalhes__subnivel-titulo">
          Equipe do posto: <strong>{nomePosto}</strong>
        </p>
        <p className="rede-detalhes__ajuda">
          Gerentes de posto e frentistas vinculados a esta unidade. Cada usuario pertence a este posto.
        </p>
      </div>

      <div className="rede-detalhes__linha-titulo rede-detalhes__linha-titulo--fim">
        <button
          type="button"
          className="botao-primario"
          onClick={() => {
            setMostrarForm((v) => !v);
          }}
        >
          {mostrarForm ? "Fechar formulario" : "Adicionar membro"}
        </button>
      </div>

      {mostrarForm ? (
        <form className="form-rede form-rede--equipe" onSubmit={onSubmitEquipe}>
          <div className="form-rede__grid">
            <select
              className="campo__input"
              value={form.papel}
              onChange={(e) => setForm((prev) => ({ ...prev, papel: e.target.value }))}
            >
              <option value="frentista">Frentista</option>
              <option value="gerente_posto">Gerente de posto</option>
            </select>
            <input
              className="campo__input"
              placeholder="Nome completo"
              value={form.nome}
              onChange={(e) => setForm((prev) => ({ ...prev, nome: e.target.value }))}
            />
            <input
              className="campo__input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Telefone"
              value={form.telefone}
              onChange={(e) => setForm((prev) => ({ ...prev, telefone: e.target.value }))}
            />
            <input
              className="campo__input"
              type="password"
              autoComplete="new-password"
              placeholder="Senha (min. 6 caracteres)"
              value={form.senha}
              onChange={(e) => setForm((prev) => ({ ...prev, senha: e.target.value }))}
            />
            <input
              className="campo__input"
              type="password"
              autoComplete="new-password"
              placeholder="Confirmar senha"
              value={form.confirmar_senha}
              onChange={(e) => setForm((prev) => ({ ...prev, confirmar_senha: e.target.value }))}
            />
          </div>
          <div className="form-rede__acoes">
            <button className="botao-primario" type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : "Criar usuario"}
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={() => {
                setForm(estadoInicialEquipe);
                setMostrarForm(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <ListaUsuariosRedePaginada
        redeId={redeId}
        papeis="gerente_posto,frentista"
        idPosto={idPosto}
        refreshKey={refreshKey}
      />
    </>
  );
}

function AbaPostos({ redeId }) {
  const [postos, setPostos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [postoEquipe, setPostoEquipe] = useState(null);
  const [mostrarFormPosto, setMostrarFormPosto] = useState(false);
  const [formPosto, setFormPosto] = useState(estadoInicialPosto);
  const [salvandoPosto, setSalvandoPosto] = useState(false);

  async function carregarPostos() {
    setCarregando(true);
    try {
      const itens = await listarPostosRede(redeId);
      setPostos(itens);
    } catch (err) {
      toastErro(err.message || "Falha ao carregar postos.");
      setPostos([]);
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregarPostos();
  }, [redeId]);

  async function onSubmitPosto(event) {
    event.preventDefault();
    setSalvandoPosto(true);
    try {
      await criarPostoRede({
        id_rede: redeId,
        nome: formPosto.nome,
        codigo: formPosto.codigo,
        nome_fantasia: formPosto.nome_fantasia,
        cnpj: formPosto.cnpj,
        logo_url: formPosto.logo_url,
        rua: formPosto.rua,
        numero: formPosto.numero,
        bairro: formPosto.bairro,
        complemento: formPosto.complemento,
        cep: formPosto.cep,
        cidade: formPosto.cidade,
        estado: formPosto.estado,
        telefone: formPosto.telefone,
        email_contato: formPosto.email_contato
      });
      toastSucesso("Posto criado com sucesso.");
      setFormPosto(estadoInicialPosto);
      setMostrarFormPosto(false);
      await carregarPostos();
    } catch (err) {
      toastErro(err.message || "Falha ao criar posto.");
    } finally {
      setSalvandoPosto(false);
    }
  }

  if (postoEquipe) {
    const nomeExibicao =
      (postoEquipe.nome_fantasia && String(postoEquipe.nome_fantasia).trim()) ||
      postoEquipe.nome ||
      postoEquipe.codigo;
    return (
      <SecaoEquipePosto
        redeId={redeId}
        idPosto={postoEquipe.id}
        nomePosto={nomeExibicao}
        onVoltar={() => setPostoEquipe(null)}
      />
    );
  }

  return (
    <>
      <p className="rede-detalhes__ajuda">
        Cadastre unidades da rede. Para cada posto, use <strong>Equipe</strong> para gerenciar gerentes e frentistas
        vinculados a essa unidade.
      </p>

      <div className="rede-detalhes__linha-titulo rede-detalhes__linha-titulo--fim">
        <button
          type="button"
          className="botao-primario"
          onClick={() => setMostrarFormPosto((v) => !v)}
        >
          {mostrarFormPosto ? "Fechar formulario" : "Novo posto"}
        </button>
      </div>

      {mostrarFormPosto ? (
        <form className="form-rede form-rede--equipe" onSubmit={onSubmitPosto}>
          <p className="rede-detalhes__ajuda rede-detalhes__ajuda--form">
            Campos obrigatorios: <strong>nome</strong> e <strong>codigo</strong> (unico na rede). CNPJ, se informado,
            deve ter 14 digitos; CEP, 8 digitos; logo deve ser URL http(s) valida.
          </p>
          <div className="form-rede__grid">
            <input
              className="campo__input"
              placeholder="Nome / razao social da unidade"
              value={formPosto.nome}
              onChange={(e) => setFormPosto((p) => ({ ...p, nome: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Codigo interno (unico na rede)"
              value={formPosto.codigo}
              onChange={(e) => setFormPosto((p) => ({ ...p, codigo: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Nome fantasia"
              value={formPosto.nome_fantasia}
              onChange={(e) => setFormPosto((p) => ({ ...p, nome_fantasia: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="CNPJ (14 digitos)"
              inputMode="numeric"
              value={formPosto.cnpj}
              onChange={(e) => setFormPosto((p) => ({ ...p, cnpj: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Rua / logradouro"
              value={formPosto.rua}
              onChange={(e) => setFormPosto((p) => ({ ...p, rua: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Numero"
              value={formPosto.numero}
              onChange={(e) => setFormPosto((p) => ({ ...p, numero: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Bairro"
              value={formPosto.bairro}
              onChange={(e) => setFormPosto((p) => ({ ...p, bairro: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Complemento"
              value={formPosto.complemento}
              onChange={(e) => setFormPosto((p) => ({ ...p, complemento: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="CEP (8 digitos)"
              inputMode="numeric"
              value={formPosto.cep}
              onChange={(e) => setFormPosto((p) => ({ ...p, cep: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Cidade"
              value={formPosto.cidade}
              onChange={(e) => setFormPosto((p) => ({ ...p, cidade: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="UF"
              maxLength={2}
              value={formPosto.estado}
              onChange={(e) => setFormPosto((p) => ({ ...p, estado: e.target.value.toUpperCase() }))}
            />
            <input
              className="campo__input"
              placeholder="Telefone"
              inputMode="tel"
              value={formPosto.telefone}
              onChange={(e) => setFormPosto((p) => ({ ...p, telefone: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="E-mail de contato"
              type="email"
              autoComplete="email"
              value={formPosto.email_contato}
              onChange={(e) => setFormPosto((p) => ({ ...p, email_contato: e.target.value }))}
            />
            <input
              className="campo__input form-rede__input-span2"
              placeholder="URL do logo (https://...)"
              type="url"
              value={formPosto.logo_url}
              onChange={(e) => setFormPosto((p) => ({ ...p, logo_url: e.target.value }))}
            />
          </div>
          <div className="form-rede__acoes">
            <button className="botao-primario" type="submit" disabled={salvandoPosto}>
              {salvandoPosto ? "Salvando..." : "Criar posto"}
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={() => {
                setFormPosto(estadoInicialPosto);
                setMostrarFormPosto(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="tabela-wrap">
        <table className="tabela-redes tabela-redes--postos-detalhe">
          <thead>
            <tr>
              <th>Unidade</th>
              <th>Codigo</th>
              <th>CNPJ</th>
              <th>Endereco</th>
              <th>Contato</th>
              <th>Logo</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {postos.map((p) => {
              const linhaEndereco = [
                [p.rua, p.numero].filter(Boolean).join(", "),
                p.bairro,
                [p.cidade, p.estado].filter(Boolean).join(" / "),
                p.cep ? `CEP ${formatarCepExibicao(p.cep)}` : ""
              ]
                .filter(Boolean)
                .join(" — ");
              return (
                <tr key={p.id}>
                  <td>
                    <span className="tabela-celula__principal">
                      {(p.nome_fantasia && String(p.nome_fantasia).trim()) || p.nome}
                    </span>
                    {p.nome_fantasia && String(p.nome_fantasia).trim() && p.nome !== p.nome_fantasia ? (
                      <span className="tabela-celula__sub">{p.nome}</span>
                    ) : null}
                  </td>
                  <td className="tabela-num">{p.codigo}</td>
                  <td className="tabela-num">{p.cnpj ? formatarCnpjExibicao(p.cnpj) : "—"}</td>
                  <td>{linhaEndereco || "—"}</td>
                  <td>
                    {[p.telefone, p.email_contato].filter(Boolean).join(" · ") || "—"}
                  </td>
                  <td className="tabela-celula--logo">
                    {p.logo_url ? (
                      <img src={p.logo_url} alt="" className="tabela-logo-thumb" loading="lazy" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td>
                    <button
                      type="button"
                      className="tabela-btn tabela-btn--acento"
                      onClick={() => setPostoEquipe(p)}
                    >
                      Equipe
                    </button>
                  </td>
                </tr>
              );
            })}
            {!carregando && postos.length === 0 ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={7}>Nenhum posto cadastrado. Crie um posto para depois vincular a equipe.</td>
              </tr>
            ) : null}
            {carregando ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={7}>Carregando postos...</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

function AbaCampanhas({ redeId }) {
  const [campanhas, setCampanhas] = useState([]);
  const [postos, setPostos] = useState([]);
  const [carregando, setCarregando] = useState(true);
  const [mostrarForm, setMostrarForm] = useState(false);
  const [editandoId, setEditandoId] = useState(null);
  const [formCampanha, setFormCampanha] = useState(estadoInicialCampanha);
  const [salvando, setSalvando] = useState(false);
  const [campanhaExpandidaId, setCampanhaExpandidaId] = useState(null);

  async function carregar() {
    setCarregando(true);
    const campanhasP = listarCampanhasRede(redeId).then(
      (itens) => ({ ok: true, itens }),
      (err) => ({ ok: false, err })
    );
    const postosP = listarPostosRede(redeId).then(
      (itens) => ({ ok: true, itens }),
      (err) => ({ ok: false, err })
    );
    const [rCamp, rPost] = await Promise.all([campanhasP, postosP]);
    if (rCamp.ok) {
      setCampanhas(rCamp.itens);
    } else {
      setCampanhas([]);
      toastErro(rCamp.err?.message || "Falha ao carregar campanhas.");
    }
    if (rPost.ok) {
      setPostos(rPost.itens);
    } else {
      setPostos([]);
      toastErro(rPost.err?.message || "Falha ao carregar postos da rede.");
    }
    setCarregando(false);
  }

  useEffect(() => {
    carregar();
  }, [redeId]);

  useEffect(() => {
    setCampanhaExpandidaId(null);
  }, [redeId]);

  useEffect(() => {
    if (!mostrarForm || !redeId) {
      return undefined;
    }
    let cancelado = false;
    (async () => {
      try {
        const p = await listarPostosRede(redeId);
        if (!cancelado) {
          setPostos(p);
        }
      } catch (err) {
        if (!cancelado) {
          toastErro(err.message || "Falha ao carregar postos da rede.");
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [mostrarForm, redeId]);

  function abrirNovo() {
    setEditandoId(null);
    setFormCampanha({ ...estadoInicialCampanha });
    setMostrarForm(true);
  }

  function abrirEditar(c) {
    setEditandoId(c.id);
    setFormCampanha({
      id: c.id,
      nome: c.nome || "",
      titulo: c.titulo || "",
      descricao: c.descricao || "",
      imagem_url: c.imagem_url || "",
      id_posto: c.id_posto || "",
      vigencia_inicio: isoParaDatetimeLocal(c.vigencia_inicio),
      vigencia_fim: isoParaDatetimeLocal(c.vigencia_fim),
      status: c.status || "ATIVA",
      canal: c.valida_no_posto_fisico ? "posto_fisico" : "app",
      modalidade_desconto: c.modalidade_desconto || "NENHUM",
      base_desconto: c.base_desconto || "VALOR_COMPRA",
      valor_desconto: c.valor_desconto != null && c.valor_desconto !== "" ? String(c.valor_desconto) : "",
      valor_minimo_compra:
        c.valor_minimo_compra != null && c.valor_minimo_compra !== "" ? String(c.valor_minimo_compra) : "0",
      max_usos_por_cliente: c.max_usos_por_cliente != null ? String(c.max_usos_por_cliente) : ""
    });
    setMostrarForm(true);
  }

  async function onSubmitCampanha(event) {
    event.preventDefault();
    const vi = datetimeLocalParaIso(formCampanha.vigencia_inicio);
    const vf = datetimeLocalParaIso(formCampanha.vigencia_fim);
    if (!vi || !vf) {
      toastErro("Informe inicio e fim da vigencia.");
      return;
    }
    if (!String(formCampanha.nome || "").trim()) {
      toastErro("Informe o nome interno da campanha.");
      return;
    }
    const vmax = String(formCampanha.max_usos_por_cliente || "").trim();
    let maxUsos = null;
    if (vmax !== "") {
      const n = parseInt(vmax, 10);
      if (Number.isNaN(n) || n < 1) {
        toastErro("Limite de usos por cliente deve ser vazio (ilimitado) ou um numero inteiro >= 1.");
        return;
      }
      maxUsos = n;
    }
    const valorDesc = parseFloat(String(formCampanha.valor_desconto || "").replace(",", "."));
    const vmin = parseFloat(String(formCampanha.valor_minimo_compra || "").replace(",", "."));
    if (Number.isNaN(vmin) || vmin < 0) {
      toastErro("Valor minimo da compra invalido (use 0 para qualquer compra).");
      return;
    }
    setSalvando(true);
    try {
      const base = {
        id_rede: redeId,
        nome: formCampanha.nome,
        titulo: formCampanha.titulo,
        descricao: formCampanha.descricao,
        imagem_url: formCampanha.imagem_url,
        id_posto: formCampanha.id_posto || "",
        vigencia_inicio: vi,
        vigencia_fim: vf,
        status: formCampanha.status || "ATIVA",
        valida_no_app: formCampanha.canal === "app",
        valida_no_posto_fisico: formCampanha.canal === "posto_fisico",
        modalidade_desconto: formCampanha.modalidade_desconto || "NENHUM",
        base_desconto: formCampanha.base_desconto || "VALOR_COMPRA",
        valor_desconto: Number.isNaN(valorDesc) ? 0 : valorDesc,
        valor_minimo_compra: Number.isNaN(vmin) ? 0 : vmin,
        max_usos_por_cliente: maxUsos
      };
      if (editandoId) {
        await editarCampanhaRede({ ...base, id: editandoId });
        toastSucesso("Campanha atualizada.");
      } else {
        await criarCampanhaRede(base);
        toastSucesso("Campanha criada.");
      }
      setFormCampanha({ ...estadoInicialCampanha });
      setEditandoId(null);
      setMostrarForm(false);
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar campanha.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <p className="rede-detalhes__ajuda">
        Escolha <strong>um</strong> canal: <strong>aplicativo</strong> ou <strong>posto fisico</strong> (nao sao
        combinados). Escopo de posto: <strong>toda a rede</strong> ou <strong>um posto</strong>. Desconto: percentual
        ou valor fixo sobre a compra, por litro ou por unidade; valor minimo da compra (0 = qualquer); limite de usos
        por cliente (vazio = ilimitado ate o fim da vigencia).
      </p>
      <div className="rede-detalhes__linha-titulo rede-detalhes__linha-titulo--fim">
        <button
          type="button"
          className="botao-primario"
          onClick={() => {
            if (mostrarForm) {
              setMostrarForm(false);
              setEditandoId(null);
              setFormCampanha({ ...estadoInicialCampanha });
            } else {
              abrirNovo();
            }
          }}
        >
          {mostrarForm ? "Fechar formulario" : "Nova campanha"}
        </button>
      </div>

      {mostrarForm ? (
        <form className="form-rede form-rede--equipe" onSubmit={onSubmitCampanha}>
          <p className="rede-detalhes__ajuda rede-detalhes__ajuda--form">
            Datas em horario local; a API envia em UTC (ISO8601). Sem desconto: modalidade &quot;Nenhum&quot; e valor do
            desconto 0. Percentual: 0–100. Limite de usos: vazio = sem limite ate o fim da promocao.
          </p>
          <div className="form-rede__grid form-rede__grid--canal-campanha">
            <span className="form-rede__label-canal">Canal da promocao</span>
            <label className="form-rede__radio-linha">
              <input
                type="radio"
                name="gaspass-canal-campanha"
                value="app"
                checked={formCampanha.canal === "app"}
                onChange={() => setFormCampanha((p) => ({ ...p, canal: "app" }))}
              />
              Aplicativo
            </label>
            <label className="form-rede__radio-linha">
              <input
                type="radio"
                name="gaspass-canal-campanha"
                value="posto_fisico"
                checked={formCampanha.canal === "posto_fisico"}
                onChange={() => setFormCampanha((p) => ({ ...p, canal: "posto_fisico" }))}
              />
              Posto fisico
            </label>
          </div>
          <div className="form-rede__grid">
            <input
              className="campo__input"
              placeholder="Nome interno (identificacao)"
              value={formCampanha.nome}
              onChange={(e) => setFormCampanha((p) => ({ ...p, nome: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Titulo (promocional)"
              value={formCampanha.titulo}
              onChange={(e) => setFormCampanha((p) => ({ ...p, titulo: e.target.value }))}
            />
            <select
              className="campo__input"
              value={formCampanha.status}
              onChange={(e) => setFormCampanha((p) => ({ ...p, status: e.target.value }))}
              aria-label="Status da campanha"
            >
              <option value="RASCUNHO">Rascunho</option>
              <option value="ATIVA">Ativa</option>
              <option value="PAUSADA">Pausada</option>
              <option value="ARQUIVADA">Arquivada</option>
            </select>
            <select
              className="campo__input"
              value={formCampanha.id_posto}
              onChange={(e) => setFormCampanha((p) => ({ ...p, id_posto: e.target.value }))}
              aria-label="Escopo do posto"
            >
              <option value="">Todos os postos da rede</option>
              {postos.map((p) => (
                <option key={p.id} value={p.id}>
                  {(p.nome_fantasia && p.nome_fantasia.trim()) || p.nome} ({p.codigo})
                </option>
              ))}
            </select>
            <select
              className="campo__input"
              value={formCampanha.modalidade_desconto}
              onChange={(e) => setFormCampanha((p) => ({ ...p, modalidade_desconto: e.target.value }))}
              aria-label="Modalidade de desconto"
            >
              <option value="NENHUM">Sem desconto (informativo)</option>
              <option value="PERCENTUAL">Percentual</option>
              <option value="VALOR_FIXO">Valor fixo (R$)</option>
            </select>
            <select
              className="campo__input"
              value={formCampanha.base_desconto}
              onChange={(e) => setFormCampanha((p) => ({ ...p, base_desconto: e.target.value }))}
              aria-label="Base do desconto"
            >
              <option value="VALOR_COMPRA">Sobre o valor da compra</option>
              <option value="LITRO">Por litro</option>
              <option value="UNIDADE">Por unidade</option>
            </select>
            <input
              className="campo__input"
              placeholder="Valor do desconto (% ou R$ conforme modalidade)"
              inputMode="decimal"
              value={formCampanha.valor_desconto}
              onChange={(e) => setFormCampanha((p) => ({ ...p, valor_desconto: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Valor minimo da compra (0 = qualquer)"
              inputMode="decimal"
              value={formCampanha.valor_minimo_compra}
              onChange={(e) => setFormCampanha((p) => ({ ...p, valor_minimo_compra: e.target.value }))}
            />
            <input
              className="campo__input"
              placeholder="Max usos por cliente (vazio = ilimitado)"
              inputMode="numeric"
              value={formCampanha.max_usos_por_cliente}
              onChange={(e) => setFormCampanha((p) => ({ ...p, max_usos_por_cliente: e.target.value }))}
            />
            <input
              className="campo__input"
              type="datetime-local"
              value={formCampanha.vigencia_inicio}
              onChange={(e) => setFormCampanha((p) => ({ ...p, vigencia_inicio: e.target.value }))}
            />
            <input
              className="campo__input"
              type="datetime-local"
              value={formCampanha.vigencia_fim}
              onChange={(e) => setFormCampanha((p) => ({ ...p, vigencia_fim: e.target.value }))}
            />
            <input
              className="campo__input form-rede__input-span2"
              placeholder="URL da imagem (https://...)"
              type="url"
              value={formCampanha.imagem_url}
              onChange={(e) => setFormCampanha((p) => ({ ...p, imagem_url: e.target.value }))}
            />
            <div className="form-rede__input-span2 campanha-descricao-editor-wrap">
              <span className="form-rede__titulo-aux" id="label-campanha-descricao">
                Descricao e regras (HTML)
              </span>
              <CampanhaDescricaoEditor
                value={formCampanha.descricao}
                onChange={(html) => setFormCampanha((p) => ({ ...p, descricao: html }))}
                placeholder="Texto, listas, cores, alinhamento..."
              />
            </div>
          </div>
          <div className="form-rede__acoes">
            <button className="botao-primario" type="submit" disabled={salvando}>
              {salvando ? "Salvando..." : editandoId ? "Salvar alteracoes" : "Criar campanha"}
            </button>
            <button
              type="button"
              className="botao-secundario"
              onClick={() => {
                setFormCampanha({ ...estadoInicialCampanha });
                setEditandoId(null);
                setMostrarForm(false);
              }}
            >
              Cancelar
            </button>
          </div>
        </form>
      ) : null}

      <div className="tabela-wrap tabela-wrap--campanhas">
        <table className="tabela-redes tabela-redes--compacta tabela-redes--campanhas-principal">
          <thead>
            <tr>
              <th className="tabela-redes__th-expand" scope="col" aria-label="Mais detalhes" />
              <th>Promocao</th>
              <th>Canais</th>
              <th>Vigencia</th>
              <th>Status</th>
              <th>Acoes</th>
            </tr>
          </thead>
          <tbody>
            {campanhas.map((c) => {
              const aberta = campanhaExpandidaId === c.id;
              return (
                <Fragment key={c.id}>
                  <tr className={aberta ? "tabela-redes__linha--aberta" : undefined}>
                    <td className="tabela-redes__col-expand">
                      <button
                        type="button"
                        className="tabela-redes__expand"
                        aria-expanded={aberta}
                        aria-label={
                          aberta ? "Ocultar escopo, desconto e demais dados" : "Ver escopo, desconto e demais dados"
                        }
                        onClick={() =>
                          setCampanhaExpandidaId((id) => (id === c.id ? null : c.id))
                        }
                      >
                        <span className="tabela-redes__expand-ico" aria-hidden>
                          {aberta ? "▼" : "▶"}
                        </span>
                      </button>
                    </td>
                    <td className="tabela-campanha__col-promo">
                      <span className="tabela-celula__principal">{c.titulo_exibicao || c.nome}</span>
                      {c.titulo && c.nome && c.titulo !== c.nome ? (
                        <span className="tabela-celula__sub">{c.nome}</span>
                      ) : null}
                    </td>
                    <td>{rotuloCanaisCampanha(c)}</td>
                    <td className="tabela-celula--stack tabela-campanha__col-vigencia">
                      {c.vigencia_inicio ? new Date(c.vigencia_inicio).toLocaleString() : "—"}
                      <span className="tabela-celula__sub">
                        ate {c.vigencia_fim ? new Date(c.vigencia_fim).toLocaleString() : "—"}
                      </span>
                    </td>
                    <td>
                      <span
                        className={`tag-status ${c.status === "ATIVA" ? "tag-status--ativo" : "tag-status--inativo"}`}
                      >
                        {rotuloStatusCampanha(c.status)}
                      </span>
                    </td>
                    <td>
                      <button type="button" className="tabela-btn" onClick={() => abrirEditar(c)}>
                        Editar
                      </button>
                    </td>
                  </tr>
                  {aberta ? (
                    <tr className="tabela-redes__linha-detalhe">
                      <td colSpan={6}>
                        <div
                          className="tabela-redes__detalhe-grid"
                          role="region"
                          aria-label="Detalhes da campanha"
                        >
                          <div className="tabela-redes__detalhe-item">
                            <span className="tabela-redes__detalhe-label">Escopo do posto</span>
                            <span className="tabela-redes__detalhe-valor">
                              {c.escopo === "posto" ? "Posto especifico" : "Rede inteira"}
                            </span>
                          </div>
                          <div className="tabela-redes__detalhe-item tabela-redes__detalhe-item--wide">
                            <span className="tabela-redes__detalhe-label">Desconto</span>
                            <span className="tabela-redes__detalhe-valor">
                              {resumoDescontoCampanha(c)}
                              {c.modalidade_desconto && c.modalidade_desconto !== "NENHUM" ? (
                                <span className="tabela-celula__sub"> — {rotuloBaseDesconto(c.base_desconto)}</span>
                              ) : null}
                            </span>
                          </div>
                          <div className="tabela-redes__detalhe-item">
                            <span className="tabela-redes__detalhe-label">Min. compra</span>
                            <span className="tabela-redes__detalhe-valor tabela-num">
                              {c.valor_minimo_compra != null ? `R$ ${Number(c.valor_minimo_compra).toFixed(2)}` : "—"}
                            </span>
                          </div>
                          <div className="tabela-redes__detalhe-item">
                            <span className="tabela-redes__detalhe-label">Usos por cliente</span>
                            <span className="tabela-redes__detalhe-valor">{rotuloLimiteUsosCampanha(c)}</span>
                          </div>
                          <div className="tabela-redes__detalhe-item tabela-redes__detalhe-item--imagem">
                            <span className="tabela-redes__detalhe-label">Imagem</span>
                            <span className="tabela-redes__detalhe-valor">
                              {c.imagem_url ? (
                                <img
                                  src={c.imagem_url}
                                  alt=""
                                  className="tabela-campanha__img-expandida"
                                  loading="lazy"
                                />
                              ) : (
                                "—"
                              )}
                            </span>
                          </div>
                        </div>
                      </td>
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
            {!carregando && campanhas.length === 0 ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={6}>Nenhuma campanha cadastrada.</td>
              </tr>
            ) : null}
            {carregando ? (
              <tr className="tabela-linha--placeholder">
                <td colSpan={6}>Carregando campanhas...</td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PainelEmBreve({ titulo, texto }) {
  return (
    <div className="rede-detalhes__painel-placeholder">
      <p>{texto}</p>
      <strong>
        {titulo} — Em desenvolvimento. Aqui ficara o conteudo filtrado por esta rede, sem precisar de menu
        lateral separado.
      </strong>
    </div>
  );
}

export default function RedeDetalhesSecao({ rede, onVoltar, onEditarRede }) {
  const [abaAtiva, setAbaAtiva] = useState("visao-geral");

  useEffect(() => {
    setAbaAtiva("visao-geral");
  }, [rede.id]);

  const redeContexto = useMemo(
    () => ({
      nome_fantasia: rede.nome_fantasia,
      cnpj: rede.cnpj
    }),
    [rede.nome_fantasia, rede.cnpj]
  );

  return (
    <div className="rede-detalhes">
      <div className="rede-detalhes__topo">
        <div className="rede-detalhes__titulo-wrap">
          <button type="button" className="botao-secundario rede-detalhes__voltar" onClick={onVoltar}>
            Voltar para redes
          </button>
          <h2 className="rede-detalhes__titulo">{rede.nome_fantasia}</h2>
          <p className="rede-detalhes__sub">{rede.razao_social}</p>
        </div>
        <div className="rede-detalhes__acoes-topo">
          <button type="button" className="botao-primario" onClick={() => onEditarRede(rede)}>
            Editar cadastro da rede
          </button>
        </div>
      </div>

      <div className="rede-detalhes__card rede-detalhes__card--tabs">
        <p className="rede-detalhes__kicker">
          Visao geral, gestor e clientes da rede; em <strong>Postos</strong> cadastre unidades e abra a equipe de cada
          posto.
        </p>
        <div className="rede-detalhes__tabs" role="tablist" aria-label="Areas da rede">
          {ABAS_REDE.map((aba) => (
            <button
              key={aba.id}
              type="button"
              role="tab"
              id={`rede-tab-${aba.id}`}
              aria-selected={abaAtiva === aba.id}
              aria-controls={`rede-painel-${aba.id}`}
              className={`rede-detalhes__tab ${abaAtiva === aba.id ? "rede-detalhes__tab--ativa" : ""}`}
              onClick={() => setAbaAtiva(aba.id)}
            >
              {aba.label}
            </button>
          ))}
        </div>

        <div
          className="rede-detalhes__painel"
          role="tabpanel"
          id={`rede-painel-${abaAtiva}`}
          aria-labelledby={`rede-tab-${abaAtiva}`}
        >
          {abaAtiva === "visao-geral" ? (
            <div className="tabela-redes__detalhe-grid rede-detalhes__resumo-grid">
              <div className="tabela-redes__detalhe-item">
                <span className="tabela-redes__detalhe-label">Status</span>
                <span className="tabela-redes__detalhe-valor">
                  <span className={`tag-status ${rede.ativa ? "tag-status--ativo" : "tag-status--inativo"}`}>
                    {rede.ativa ? "Ativa" : "Inativa"}
                  </span>
                </span>
              </div>
              <div className="tabela-redes__detalhe-item">
                <span className="tabela-redes__detalhe-label">CNPJ</span>
                <span className="tabela-redes__detalhe-valor tabela-num">{rede.cnpj || "—"}</span>
              </div>
              <div className="tabela-redes__detalhe-item">
                <span className="tabela-redes__detalhe-label">Contato</span>
                <span className="tabela-redes__detalhe-valor">
                  {rede.email_contato || "—"} · {rede.telefone || "—"}
                </span>
              </div>
            </div>
          ) : null}

          {abaAtiva === "gestor" ? (
            <GestoresRedeGestaoSecao idRedeFixo={rede.id} redeContexto={redeContexto} />
          ) : null}

          {abaAtiva === "clientes" ? (
            <>
              <p className="rede-detalhes__ajuda">
                Usuarios finais (app / programa de fidelidade) associados a esta rede.
              </p>
              <ListaUsuariosRedePaginada redeId={rede.id} papeis="cliente" />
            </>
          ) : null}

          {abaAtiva === "postos" ? <AbaPostos redeId={rede.id} /> : null}

          {abaAtiva === "campanhas" ? <AbaCampanhas redeId={rede.id} /> : null}

          {abaAtiva === "carteira" ? (
            <PainelEmBreve
              titulo="Carteira e financeiro"
              texto="Saldos, movimentacoes e conciliacao desta rede."
            />
          ) : null}

          {abaAtiva === "vouchers" ? (
            <PainelEmBreve titulo="Vouchers" texto="Emissao, validacao e acompanhamento de vouchers da rede." />
          ) : null}
        </div>
      </div>
    </div>
  );
}
