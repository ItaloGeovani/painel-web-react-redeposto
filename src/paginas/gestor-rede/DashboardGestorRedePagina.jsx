import { useCallback, useEffect, useMemo, useState } from "react";
import PainelLayout from "../../componentes/layout/PainelLayout";
import { MENUS_GESTOR_REDE } from "../../constantes/menusPorPapel";
import { buscarMinhaRedeGestor } from "../../servicos/redesServico";
import { toastErro } from "../../servicos/toastServico";
import AbaCarteiraRede from "../super-admin/AbaCarteiraRede";
import AbaPremiosRede from "../super-admin/AbaPremiosRede";
import AbaVouchersRede from "../super-admin/AbaVouchersRede";
import GestoresRedeGestaoSecao from "../super-admin/GestoresRedeGestaoSecao";
import { AbaCampanhas, AbaPostos, ListaUsuariosRedePaginada } from "../super-admin/RedeDetalhesSecao";
import AppCardsRedeSecao from "./AppCardsRedeSecao";
import GestorRedeAuditoriaSecao from "./GestorRedeAuditoriaSecao";
import GestorRedeRelatoriosSecao from "./GestorRedeRelatoriosSecao";

export default function DashboardGestorRedePagina({ sessao, onSair }) {
  const itensMenu = useMemo(() => MENUS_GESTOR_REDE.map((m) => m.nome), []);
  const [menuAtivo, setMenuAtivo] = useState(() => MENUS_GESTOR_REDE[0]?.nome ?? "");
  const [rede, setRede] = useState(null);
  const [carregandoRede, setCarregandoRede] = useState(true);

  const menuConfig = useMemo(
    () => MENUS_GESTOR_REDE.find((m) => m.nome === menuAtivo) || MENUS_GESTOR_REDE[0],
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
          <p>Verifique se o gestor esta vinculado a uma rede ou faca login novamente.</p>
        </article>
      );
    }

    const rctx = { nome_fantasia: rede.nome_fantasia, cnpj: rede.cnpj };
    const id = menuConfig.id;

    switch (id) {
      case "usuarios-perfis":
        return (
          <>
            <GestoresRedeGestaoSecao
              idRedeFixo={rede.id}
              redeContexto={rctx}
              somenteLeituraGestores
            />
            <p className="rede-detalhes__ajuda" style={{ marginTop: 16 }}>
              Clientes da rede
            </p>
            <ListaUsuariosRedePaginada redeId={rede.id} papeis="cliente" />
            <p className="rede-detalhes__ajuda" style={{ marginTop: 16 }}>
              Equipe dos postos
            </p>
            <ListaUsuariosRedePaginada redeId={rede.id} papeis="gerente_posto,frentista" permiteEditarEquipe />
          </>
        );
      case "postos":
        return <AbaPostos redeId={rede.id} />;
      case "campanhas":
        return <AbaCampanhas redeId={rede.id} />;
      case "carteira":
        return <AbaCarteiraRede rede={rede} onSalvo={onRedeRefresh} />;
      case "vouchers":
        return <AbaVouchersRede rede={rede} />;
      case "app-cards":
        return <AppCardsRedeSecao redeId={rede.id} />;
      case "premios":
        return <AbaPremiosRede redeId={rede.id} />;
      case "relatorios":
        return <GestorRedeRelatoriosSecao />;
      case "auditoria":
        return <GestorRedeAuditoriaSecao />;
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
