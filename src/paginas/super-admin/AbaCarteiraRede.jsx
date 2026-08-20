import { useCallback, useEffect, useMemo, useState } from "react";
import { createColumnHelper } from "@tanstack/react-table";
import {
  CheckCircle2,
  CircleDollarSign,
  Home,
  Info,
  RefreshCw,
  Search,
  Users,
  Wallet
} from "lucide-react";
import { atualizarMoedaVirtualRede } from "../../servicos/redesServico";
import { listarClientesCarteiraRede } from "../../servicos/carteiraRedeServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import CampoComAjuda from "../../componentes/CampoComAjuda";
import Button from "../../componentes/ui/Button";
import Card from "../../componentes/ui/Card";
import DataTable from "../../componentes/ui/DataTable";

const TAMANHO_PAGINA = 50;
const columnHelper = createColumnHelper();

const OPCOES_ORDENAR = [
  { value: "saldo_desc", label: "Maior saldo" },
  { value: "saldo_asc", label: "Menor saldo" },
  { value: "nome", label: "Nome (A–Z)" },
  { value: "acesso", label: "Último acesso" },
  { value: "desde", label: "Cliente desde" }
];

function parseCotacao(valor) {
  const c = parseFloat(String(valor).replace(",", "."));
  return Number.isFinite(c) ? c : null;
}

function formatarCotacaoTexto(valor) {
  const n = parseCotacao(valor);
  if (n == null || n <= 0) return "—";
  const unidade = n === 1 ? "unidade" : "unidades";
  return `${String(valor).replace(".", ",")} ${unidade} por R$ 1,00`;
}

function formatarDataHora(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("pt-BR", {
      dateStyle: "short",
      timeStyle: "short"
    });
  } catch {
    return "—";
  }
}

function formatarSaldo(n) {
  const v = Number(n);
  if (!Number.isFinite(v)) return "0";
  return v.toLocaleString("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  });
}

function ResumoCard({ icon: Icon, label, value, valueClass = "", tone = "blue" }) {
  return (
    <div className="gp-carteira-resumo">
      <div className={`gp-carteira-resumo__icon gp-carteira-resumo__icon--${tone}`} aria-hidden>
        <Icon size={20} />
      </div>
      <div>
        <p className="gp-carteira-resumo__label">{label}</p>
        <strong className={`gp-carteira-resumo__valor ${valueClass}`.trim()}>{value}</strong>
      </div>
    </div>
  );
}

function itensExpandClienteCarteira(row, nomeMoeda) {
  return [
    { label: "E-mail", value: row.email || "—" },
    { label: "Telefone", value: row.telefone || "—" },
    { label: "CPF", value: row.cpf || "—" },
    { label: "Nível", value: row.nivel_cliente || "—" },
    {
      label: `Saldo (${nomeMoeda})`,
      value: formatarSaldo(row.saldo_token)
    },
    { label: "Último acesso no app", value: formatarDataHora(row.ultimo_app_acesso_em) },
    { label: "Plataforma", value: row.ultimo_app_plataforma || "—" },
    { label: "Cliente desde", value: formatarDataHora(row.cliente_desde) },
    { label: "Status", value: row.ativo ? "Ativo" : "Inativo" },
    { label: "ID", value: row.id_usuario || "—", wide: true }
  ];
}

function AbaClientesCarteira({ rede }) {
  const [itens, setItens] = useState([]);
  const [total, setTotal] = useState(0);
  const [pagina, setPagina] = useState(1);
  const [ordenar, setOrdenar] = useState("saldo_desc");
  const [busca, setBusca] = useState("");
  const [buscaAplicada, setBuscaAplicada] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [moedaApi, setMoedaApi] = useState("");

  const nomeMoeda = useMemo(() => {
    const n = String(moedaApi || rede?.moeda_virtual_nome || "").trim();
    return n || "Moeda";
  }, [moedaApi, rede?.moeda_virtual_nome]);

  const carregar = useCallback(async () => {
    if (!rede?.id) return;
    setCarregando(true);
    try {
      const dados = await listarClientesCarteiraRede({
        idRede: rede.id,
        limite: TAMANHO_PAGINA,
        offset: (Math.max(1, pagina) - 1) * TAMANHO_PAGINA,
        q: buscaAplicada,
        ordenar
      });
      setItens(dados.itens);
      setTotal(dados.total);
      setMoedaApi(dados.moeda_virtual_nome || "");
    } catch (err) {
      toastErro(err.message || "Falha ao carregar clientes da carteira.");
      setItens([]);
      setTotal(0);
    } finally {
      setCarregando(false);
    }
  }, [rede?.id, pagina, ordenar, buscaAplicada]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  function aplicarBusca(e) {
    e?.preventDefault?.();
    setPagina(1);
    setBuscaAplicada(busca.trim());
  }

  const columns = useMemo(
    () => [
      columnHelper.accessor("nome_completo", {
        header: "Cliente",
        cell: (info) => (
          <div className="gp-carteira-clientes__nome">
            <strong>{info.getValue() || "—"}</strong>
            {info.row.original.email ? (
              <span className="gp-carteira-clientes__sub">{info.row.original.email}</span>
            ) : null}
          </div>
        )
      }),
      columnHelper.accessor("saldo_token", {
        header: nomeMoeda,
        cell: (info) => (
          <span className="gp-carteira-clientes__saldo">{formatarSaldo(info.getValue())}</span>
        )
      }),
      columnHelper.accessor("ultimo_app_acesso_em", {
        header: "Último acesso",
        cell: (info) => formatarDataHora(info.getValue())
      }),
      columnHelper.accessor("cliente_desde", {
        header: "Cliente desde",
        cell: (info) => formatarDataHora(info.getValue())
      }),
      columnHelper.accessor("ativo", {
        header: "Status",
        cell: (info) => (
          <span
            className={`gp-carteira-clientes__badge ${
              info.getValue() ? "gp-carteira-clientes__badge--ok" : "gp-carteira-clientes__badge--off"
            }`}
          >
            {info.getValue() ? "Ativo" : "Inativo"}
          </span>
        )
      })
    ],
    [nomeMoeda]
  );

  return (
    <div className="gp-carteira-clientes">
      <div className="gp-carteira-clientes__cabecalho">
        <div>
          <h3 className="gp-carteira-clientes__titulo">
            <Users size={18} aria-hidden />
            Clientes e saldos
          </h3>
          <p className="gp-carteira-clientes__desc">
            Ranking por <strong>{nomeMoeda}</strong>. Expanda a linha para ver telefone, CPF, nível e plataforma.
          </p>
        </div>
        <p className="gp-carteira-clientes__total">
          {total.toLocaleString("pt-BR")} cliente{total === 1 ? "" : "s"}
        </p>
      </div>

      <form className="gp-carteira-clientes__toolbar" onSubmit={aplicarBusca}>
        <label className="gp-carteira-clientes__busca">
          <Search size={16} aria-hidden />
          <input
            className="campo__input"
            placeholder="Buscar nome, e-mail, telefone ou CPF"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            aria-label="Buscar clientes"
          />
        </label>
        <label className="gp-carteira-clientes__ordenar">
          <span>Ordenar</span>
          <select
            className="campo__input"
            value={ordenar}
            onChange={(e) => {
              setPagina(1);
              setOrdenar(e.target.value);
            }}
            aria-label="Ordenar lista"
          >
            {OPCOES_ORDENAR.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="outline" disabled={carregando}>
          Buscar
        </Button>
        <Button
          type="button"
          variant="outline"
          icon={RefreshCw}
          onClick={() => carregar()}
          disabled={carregando}
        >
          Atualizar
        </Button>
      </form>

      <Card className="gp-carteira-clientes__tabela" padding={false}>
        <DataTable
          columns={columns}
          data={itens}
          getRowId={(row) => row.id_usuario}
          loading={carregando}
          emptyMessage="Nenhum cliente encontrado nesta rede."
          showExpandColumn
          getExpandedItems={(row) => itensExpandClienteCarteira(row, nomeMoeda)}
          pagination={{
            page: pagina,
            pageSize: TAMANHO_PAGINA,
            total,
            onPageChange: setPagina
          }}
        />
      </Card>
    </div>
  );
}

function PainelConfigMoeda({
  rede,
  onSalvo,
  somenteLeituraMoeda,
  nome,
  setNome,
  cotacao,
  setCotacao,
  expiraAtiva,
  setExpiraAtiva,
  expiraDias,
  setExpiraDias,
  salvando,
  setSalvando,
  hidratarDoRede,
  nomeExibicao,
  cotacaoExibicao,
  statusAtiva
}) {
  async function onSubmit(e) {
    e.preventDefault();
    if (somenteLeituraMoeda) return;

    const c = parseCotacao(cotacao);
    if (!String(nome).trim()) {
      toastErro("Informe o nome da moeda.");
      return;
    }
    if (c == null || c <= 0) {
      toastErro("Cotacao deve ser um numero maior que zero.");
      return;
    }
    let dias = 0;
    if (expiraAtiva) {
      dias = parseInt(String(expiraDias).replace(/\D/g, ""), 10);
      if (!Number.isFinite(dias) || dias < 1 || dias > 365) {
        toastErro("Informe dias de expiracao entre 1 e 365.");
        return;
      }
    }
    setSalvando(true);
    try {
      await atualizarMoedaVirtualRede({
        id: rede.id,
        moeda_virtual_nome: nome.trim(),
        moeda_virtual_cotacao: c,
        moeda_virtual_expira_dias: dias
      });
      toastSucesso("Configuracao da moeda virtual salva.");
      onSalvo?.();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <>
      <p className="gp-carteira__intro">
        Uma unica moeda por rede, definida pelo gestor. Recargas e cashbacks creditam a mesma unidade na carteira do
        cliente. A cotacao indica quantas unidades da moeda correspondem a <strong>R$ 1,00</strong>.
      </p>

      <div className="gp-carteira__resumo-grid">
        <ResumoCard icon={Wallet} label="Moeda virtual" value={nomeExibicao} />
        <ResumoCard icon={CircleDollarSign} label="Cotacao atual" value={cotacaoExibicao} />
        <ResumoCard
          icon={CheckCircle2}
          label="Status"
          value={statusAtiva ? "Ativa" : "Pendente"}
          valueClass={statusAtiva ? "gp-carteira-resumo__valor--ok" : "gp-carteira-resumo__valor--warn"}
          tone={statusAtiva ? "green" : "amber"}
        />
      </div>

      <Card className="gp-carteira__config" padding>
        <h3 className="gp-carteira__config-titulo">Configuracao da moeda virtual</h3>

        <div className="gp-carteira__config-grid">
          <form className="gp-carteira__form" onSubmit={onSubmit}>
            <CampoComAjuda
              rotulo="Nome da moeda"
              dica="Exemplo: Luceninhas. Esse nome aparece para o cliente no app."
            >
              <input
                className="campo__input"
                placeholder="Nome da moeda (ex.: Luceninhas)"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                aria-label="Nome da moeda virtual"
                disabled={somenteLeituraMoeda || salvando}
                readOnly={somenteLeituraMoeda}
              />
            </CampoComAjuda>

            <CampoComAjuda
              rotulo="Unidades por R$ 1,00"
              dica="Define conversao de dinheiro para moeda virtual da rede."
            >
              <input
                className="campo__input"
                placeholder="Ex.: 1"
                inputMode="decimal"
                value={cotacao}
                onChange={(e) => setCotacao(e.target.value)}
                aria-label="Cotacao: unidades por real"
                disabled={somenteLeituraMoeda || salvando}
                readOnly={somenteLeituraMoeda}
              />
            </CampoComAjuda>

            <CampoComAjuda
              rotulo="Expiracao das moedas"
              dica="Se ativo, cada credito novo (cashback, bonus, etc.) expira individualmente apos N dias. Saldo antigo nao e afetado."
            >
              <label className="form-rede__radio-linha" style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  checked={expiraAtiva}
                  onChange={(e) => setExpiraAtiva(e.target.checked)}
                  disabled={somenteLeituraMoeda || salvando}
                />
                Moedas expiram apos X dias
              </label>
              {expiraAtiva ? (
                <input
                  className="campo__input"
                  style={{ marginTop: 8 }}
                  placeholder="Dias (1–365)"
                  inputMode="numeric"
                  value={expiraDias}
                  onChange={(e) => setExpiraDias(e.target.value)}
                  aria-label="Dias para expirar cada credito"
                  disabled={somenteLeituraMoeda || salvando}
                  readOnly={somenteLeituraMoeda}
                />
              ) : null}
            </CampoComAjuda>

            {somenteLeituraMoeda ? (
              <p className="gp-carteira__hint">Somente o gestor da rede pode alterar nome e cotacao da moeda.</p>
            ) : (
              <div className="gp-carteira__acoes">
                <Button type="submit" variant="primary" disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar moeda virtual"}
                </Button>
                <Button type="button" variant="outline" onClick={hidratarDoRede} disabled={salvando}>
                  Cancelar
                </Button>
              </div>
            )}
          </form>

          <aside className="gp-carteira__como">
            <div className="gp-carteira__como-titulo">
              <Info size={16} aria-hidden />
              <strong>Como funciona</strong>
            </div>
            <p>
              A cotacao define quantas unidades o cliente recebe por cada <strong>R$ 1,00</strong> em recargas e
              cashbacks.
            </p>
            <p className="gp-carteira__como-exemplos-titulo">Exemplos</p>
            <ul>
              <li>
                <strong>1</strong> = cada real compra 1 unidade
              </li>
              <li>
                <strong>100</strong> = cada real compra 100 unidades
              </li>
            </ul>
            <p className="gp-carteira__como-nota">
              <RefreshCw size={14} aria-hidden />
              Recargas e cashbacks usam a mesma unidade da carteira.
            </p>
          </aside>
        </div>
      </Card>
    </>
  );
}

export default function AbaCarteiraRede({ rede, onSalvo, somenteLeituraMoeda = false }) {
  const [aba, setAba] = useState("configuracoes");
  const [nome, setNome] = useState("");
  const [cotacao, setCotacao] = useState("1");
  const [expiraAtiva, setExpiraAtiva] = useState(false);
  const [expiraDias, setExpiraDias] = useState("7");
  const [salvando, setSalvando] = useState(false);

  function hidratarDoRede() {
    setNome(rede.moeda_virtual_nome != null ? String(rede.moeda_virtual_nome) : "");
    const c = rede.moeda_virtual_cotacao;
    if (c != null && Number.isFinite(Number(c))) {
      setCotacao(String(c).replace(".", ","));
    } else {
      setCotacao("1");
    }
    const d = Number(rede.moeda_virtual_expira_dias) || 0;
    setExpiraAtiva(d > 0);
    setExpiraDias(d > 0 ? String(d) : "7");
  }

  useEffect(() => {
    hidratarDoRede();
  }, [rede.id, rede.moeda_virtual_nome, rede.moeda_virtual_cotacao, rede.moeda_virtual_expira_dias]);

  const nomeExibicao = useMemo(() => {
    const n = String(nome || "").trim();
    return n || "—";
  }, [nome]);

  const cotacaoExibicao = useMemo(() => formatarCotacaoTexto(cotacao), [cotacao]);

  const statusAtiva = useMemo(() => {
    const n = String(nome || "").trim();
    const c = parseCotacao(cotacao);
    return Boolean(n) && c != null && c > 0;
  }, [nome, cotacao]);

  return (
    <div className="gp-carteira">
      <div className="gp-carteira__breadcrumb">
        <Home size={14} aria-hidden />
        <span>
          {rede?.nome_fantasia || "Rede"} — CNPJ {rede?.cnpj || "—"}
        </span>
      </div>

      <div className="gp-carteira__tabs" role="tablist" aria-label="Áreas da carteira">
        <button
          type="button"
          role="tab"
          aria-selected={aba === "configuracoes"}
          className={`gp-carteira__tab ${aba === "configuracoes" ? "gp-carteira__tab--ativa" : ""}`}
          onClick={() => setAba("configuracoes")}
        >
          Configurações
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={aba === "clientes"}
          className={`gp-carteira__tab ${aba === "clientes" ? "gp-carteira__tab--ativa" : ""}`}
          onClick={() => setAba("clientes")}
        >
          Clientes
        </button>
      </div>

      {aba === "configuracoes" ? (
        <PainelConfigMoeda
          rede={rede}
          onSalvo={onSalvo}
          somenteLeituraMoeda={somenteLeituraMoeda}
          nome={nome}
          setNome={setNome}
          cotacao={cotacao}
          setCotacao={setCotacao}
          expiraAtiva={expiraAtiva}
          setExpiraAtiva={setExpiraAtiva}
          expiraDias={expiraDias}
          setExpiraDias={setExpiraDias}
          salvando={salvando}
          setSalvando={setSalvando}
          hidratarDoRede={hidratarDoRede}
          nomeExibicao={nomeExibicao}
          cotacaoExibicao={cotacaoExibicao}
          statusAtiva={statusAtiva}
        />
      ) : (
        <AbaClientesCarteira rede={rede} />
      )}
    </div>
  );
}
