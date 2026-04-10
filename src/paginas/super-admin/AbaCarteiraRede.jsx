import { useEffect, useState } from "react";
import { atualizarMoedaVirtualRede } from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

export default function AbaCarteiraRede({ rede, onSalvo, somenteLeituraMoeda = false }) {
  const [nome, setNome] = useState("");
  const [cotacao, setCotacao] = useState("1");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setNome(rede.moeda_virtual_nome != null ? String(rede.moeda_virtual_nome) : "");
    const c = rede.moeda_virtual_cotacao;
    if (c != null && Number.isFinite(Number(c))) {
      setCotacao(String(c).replace(".", ","));
    } else {
      setCotacao("1");
    }
  }, [rede.id, rede.moeda_virtual_nome, rede.moeda_virtual_cotacao]);

  if (somenteLeituraMoeda) {
    return (
      <div className="aba-carteira-rede">
        <p className="rede-detalhes__ajuda">
          Visao da moeda virtual da rede. A cotacao indica quantas unidades correspondem a <strong>R$ 1,00</strong>.
        </p>
        <div className="form-rede__grid">
          <input
            className="campo__input form-rede__input-span2"
            value={nome}
            readOnly
            disabled
            aria-label="Nome da moeda virtual"
          />
          <input
            className="campo__input"
            value={cotacao}
            readOnly
            disabled
            aria-label="Cotacao: unidades por real"
          />
        </div>
        <p className="rede-detalhes__ajuda" style={{ marginTop: 12 }}>
          Somente o gestor da rede pode alterar nome e cotacao da moeda.
        </p>
      </div>
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    const c = parseFloat(String(cotacao).replace(",", "."));
    if (!String(nome).trim()) {
      toastErro("Informe o nome da moeda.");
      return;
    }
    if (!Number.isFinite(c) || c <= 0) {
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

  return (
    <div className="aba-carteira-rede">
      <p className="rede-detalhes__ajuda">
        Uma unica moeda por rede, definida pelo gestor. Recargas e cashbacks creditam a mesma unidade na carteira do
        cliente. A cotacao indica quantas unidades da moeda correspondem a <strong>R$ 1,00</strong> (ex.: 1 = cada
        real compra 1 unidade; 100 = cada real compra 100 unidades).
      </p>
      <form className="form-rede form-rede--equipe" onSubmit={onSubmit}>
        <div className="form-rede__grid">
          <input
            className="campo__input form-rede__input-span2"
            placeholder="Nome da moeda (ex.: NioCoins)"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            aria-label="Nome da moeda virtual"
          />
          <input
            className="campo__input"
            placeholder="Unidades por R$ 1,00"
            inputMode="decimal"
            value={cotacao}
            onChange={(e) => setCotacao(e.target.value)}
            aria-label="Cotacao: unidades por real"
          />
        </div>
        <p className="rede-detalhes__ajuda rede-detalhes__ajuda--form">
          Movimentacoes detalhadas (saldos por cliente, historico, conciliacao) entram em etapas futuras; aqui fica a
          configuracao da economia da rede.
        </p>
        <div className="form-rede__acoes">
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar moeda virtual"}
          </button>
        </div>
      </form>
    </div>
  );
}
