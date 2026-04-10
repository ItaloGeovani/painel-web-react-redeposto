import { useCallback, useEffect, useMemo, useState } from "react";
import PainelLayout from "../../componentes/layout/PainelLayout";
import { MENUS_FRENTISTA } from "../../constantes/menusPorPapel";
import { buscarMinhaRedeGestor } from "../../servicos/redesServico";
import { toastErro } from "../../servicos/toastServico";
import AbaCarteiraRede from "../super-admin/AbaCarteiraRede";
import AbaVouchersRede from "../super-admin/AbaVouchersRede";
import { AbaCampanhas } from "../super-admin/RedeDetalhesSecao";
import GestorRedeRelatoriosSecao from "../gestor-rede/GestorRedeRelatoriosSecao";

export default function DashboardFrentistaPagina({ sessao, onSair }) {
  const itensMenu = useMemo(() => MENUS_FRENTISTA.map((m) => m.nome), []);
  const [menuAtivo, setMenuAtivo] = useState(() => MENUS_FRENTISTA[0]?.nome ?? "");
  const [rede, setRede] = useState(null);
  const [carregandoRede, setCarregandoRede] = useState(true);

  const menuConfig = useMemo(
    () => MENUS_FRENTISTA.find((m) => m.nome === menuAtivo) || MENUS_FRENTISTA[0],
    [menuAtivo]
  );

  const onRedeRefresh = useCallback(async () => {
    try {
      const r = await buscarMinhaRedeGestor();
      setRede(r);
    } catch (err) {
      toastErro(err.message || "Falha ao atualizar dados da rede.");
    }
  }, []);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCarregandoRede(true);
      try {
        const r = await buscarMinhaRedeGestor();
        if (!cancelado) {
          setRede(r);
        }
      } catch (err) {
        if (!cancelado) {
          toastErro(err.message || "Falha ao carregar dados da rede.");
          setRede(null);
        }
      } finally {
        if (!cancelado) {
          setCarregandoRede(false);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  function renderConteudo() {
    if (carregandoRede) {
      return (
        <article className="card-resumo">
          <p>Carregando dados da rede...</p>
        </article>
      );
    }
    if (!rede) {
      return (
        <article className="card-resumo">
          <strong>Nao foi possivel carregar a rede</strong>
          <p>Verifique se o usuario esta vinculado a uma rede ou faca login novamente.</p>
        </article>
      );
    }

    const id = menuConfig.id;

    switch (id) {
      case "campanhas":
        return <AbaCampanhas redeId={rede.id} somenteLeitura />;
      case "carteira":
        return <AbaCarteiraRede rede={rede} onSalvo={onRedeRefresh} somenteLeituraMoeda />;
      case "vouchers":
        return <AbaVouchersRede rede={rede} />;
      case "relatorios":
        return <GestorRedeRelatoriosSecao />;
      default:
        return null;
    }
  }

  return (
    <PainelLayout
      titulo={menuConfig.titulo}
      subtitulo={menuConfig.subtitulo}
      usuario={sessao?.usuario}
      itensMenu={itensMenu}
      itemMenuAtivo={menuAtivo}
      onSelecionarMenu={setMenuAtivo}
      onSair={onSair}
    >
      <div className="painel-gestor-rede">
        {rede ? (
          <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
            <strong>{rede.nome_fantasia}</strong> — CNPJ {rede.cnpj || "—"}
          </p>
        ) : null}
        {renderConteudo()}
      </div>
    </PainelLayout>
  );
}
