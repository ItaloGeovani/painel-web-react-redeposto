import { useCallback, useEffect, useMemo, useState } from "react";
import PainelLayout from "../../componentes/layout/PainelLayout";
import { MENUS_GERENTE_POSTO } from "../../constantes/menusPorPapel";
import { buscarMinhaRedeGestor } from "../../servicos/redesServico";
import { listarPostosRede } from "../../servicos/postosServico";
import { toastErro } from "../../servicos/toastServico";
import AbaCarteiraRede from "../super-admin/AbaCarteiraRede";
import AbaPremiosRede from "../super-admin/AbaPremiosRede";
import AbaVouchersRede from "../super-admin/AbaVouchersRede";
import { AbaCampanhas, ListaUsuariosRedePaginada, SecaoEquipePosto } from "../super-admin/RedeDetalhesSecao";
import AppCardsRedeSecao from "../gestor-rede/AppCardsRedeSecao";
import CombustiveisRedeSecao from "../gestor-rede/CombustiveisRedeSecao";
import GestorRedeAuditoriaSecao from "../gestor-rede/GestorRedeAuditoriaSecao";
import GestorRedeRelatoriosSecao from "../gestor-rede/GestorRedeRelatoriosSecao";
import GestorConfiguracoesSecao from "../gestor-rede/GestorConfiguracoesSecao";

export default function DashboardGerentePostoPagina({ sessao, onSair }) {
  const itensMenu = useMemo(() => MENUS_GERENTE_POSTO.map((m) => m.nome), []);
  const [menuAtivo, setMenuAtivo] = useState(() => MENUS_GERENTE_POSTO[0]?.nome ?? "");
  const [rede, setRede] = useState(null);
  const [carregandoRede, setCarregandoRede] = useState(true);
  const [nomePostoExibicao, setNomePostoExibicao] = useState("");

  const idPosto = String(sessao?.usuario?.id_posto || "").trim();

  const menuConfig = useMemo(
    () => MENUS_GERENTE_POSTO.find((m) => m.nome === menuAtivo) || MENUS_GERENTE_POSTO[0],
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

  useEffect(() => {
    if (!rede?.id || !idPosto) {
      setNomePostoExibicao("");
      return;
    }
    let cancelado = false;
    (async () => {
      try {
        const list = await listarPostosRede(rede.id);
        const p = list.find((x) => x.id === idPosto);
        const nome =
          (p?.nome_fantasia && String(p.nome_fantasia).trim()) || p?.nome || "";
        if (!cancelado) {
          setNomePostoExibicao(nome || idPosto);
        }
      } catch {
        if (!cancelado) {
          setNomePostoExibicao(idPosto);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [rede?.id, idPosto]);

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
    if (!idPosto) {
      return (
        <article className="card-resumo">
          <strong>Posto nao identificado</strong>
          <p>Seu usuario precisa estar vinculado a um posto. Contate o gestor da rede.</p>
        </article>
      );
    }

    const id = menuConfig.id;

    switch (id) {
      case "usuarios-perfis":
        return (
          <>
            <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
              Clientes da rede
            </p>
            <ListaUsuariosRedePaginada redeId={rede.id} papeis="cliente" />
            <p className="rede-detalhes__ajuda" style={{ marginTop: 16 }}>
              Equipe do seu posto
            </p>
            <SecaoEquipePosto
              redeId={rede.id}
              idPosto={idPosto}
              nomePosto={nomePostoExibicao || "Seu posto"}
              onVoltar={() => {}}
              ocultarNavegacaoVoltar
            />
          </>
        );
      case "campanhas":
        return <AbaCampanhas redeId={rede.id} />;
      case "combustiveis":
        return <CombustiveisRedeSecao />;
      case "carteira":
        return <AbaCarteiraRede rede={rede} onSalvo={onRedeRefresh} somenteLeituraMoeda />;
      case "vouchers":
        return <AbaVouchersRede rede={rede} />;
      case "app-cards":
        return <AppCardsRedeSecao redeId={rede.id} />;
      case "premios":
        return <AbaPremiosRede redeId={rede.id} />;
      case "relatorios":
        return <GestorRedeRelatoriosSecao />;
      case "configuracoes":
        return <GestorConfiguracoesSecao />;
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
            {nomePostoExibicao || idPosto ? (
              <>
                {" "}
                — Posto: <strong>{nomePostoExibicao || "—"}</strong>
              </>
            ) : null}
          </p>
        ) : null}
        {renderConteudo()}
      </div>
    </PainelLayout>
  );
}
