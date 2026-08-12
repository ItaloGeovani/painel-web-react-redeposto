import { useEffect, useMemo, useState } from "react";
import {
  CheckCircle2,
  CircleDollarSign,
  Home,
  Info,
  RefreshCw,
  Wallet
} from "lucide-react";
import { atualizarMoedaVirtualRede } from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import CampoComAjuda from "../../componentes/CampoComAjuda";
import Button from "../../componentes/ui/Button";
import Card from "../../componentes/ui/Card";

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

export default function AbaCarteiraRede({ rede, onSalvo, somenteLeituraMoeda = false }) {
  const [nome, setNome] = useState("");
  const [cotacao, setCotacao] = useState("1");
  const [salvando, setSalvando] = useState(false);

  function hidratarDoRede() {
    setNome(rede.moeda_virtual_nome != null ? String(rede.moeda_virtual_nome) : "");
    const c = rede.moeda_virtual_cotacao;
    if (c != null && Number.isFinite(Number(c))) {
      setCotacao(String(c).replace(".", ","));
    } else {
      setCotacao("1");
    }
  }

  useEffect(() => {
    hidratarDoRede();
  }, [rede.id, rede.moeda_virtual_nome, rede.moeda_virtual_cotacao]);

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
    setSalvando(true);
    try {
      await atualizarMoedaVirtualRede({
        id: rede.id,
        moeda_virtual_nome: nome.trim(),
        moeda_virtual_cotacao: c
      });
      toastSucesso("Configuracao da moeda virtual salva.");
      onSalvo?.();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function onCancelar() {
    hidratarDoRede();
  }

  return (
    <div className="gp-carteira">
      <div className="gp-carteira__breadcrumb">
        <Home size={14} aria-hidden />
        <span>
          {rede?.nome_fantasia || "Rede"} — CNPJ {rede?.cnpj || "—"}
        </span>
      </div>

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

            {somenteLeituraMoeda ? (
              <p className="gp-carteira__hint">Somente o gestor da rede pode alterar nome e cotacao da moeda.</p>
            ) : (
              <div className="gp-carteira__acoes">
                <Button type="submit" variant="primary" disabled={salvando}>
                  {salvando ? "Salvando..." : "Salvar moeda virtual"}
                </Button>
                <Button type="button" variant="outline" onClick={onCancelar} disabled={salvando}>
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

      <div className="gp-carteira__aviso" role="note">
        <Info size={18} aria-hidden />
        <p>
          Movimentacoes detalhadas (saldos por cliente, historico, conciliacao) entram em etapas futuras; aqui fica a
          configuracao da economia da rede.
        </p>
      </div>
    </div>
  );
}
