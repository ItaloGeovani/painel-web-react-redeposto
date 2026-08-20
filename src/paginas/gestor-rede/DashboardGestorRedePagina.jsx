import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import PainelLayout from "../../componentes/layout/PainelLayout";
import { MENUS_GESTOR_REDE } from "../../constantes/menusPorPapel";
import {
  PREFIXO_GESTOR,
  menuPorId,
  menusComPath
} from "../../constantes/rotas";
import { buscarMinhaRedeGestor } from "../../servicos/redesServico";
import { toastErro } from "../../servicos/toastServico";
import { isDesktop } from "../../configuracao/appTarget";
import { PAPEL_GESTOR_REDE } from "../../constantes/papeis";
import { aplicarTituloDesktop } from "../../utilitarios/desktopJanela";
import { nomeRedeDisplay } from "../../utilitarios/redeBranding";
import AbaCarteiraRede from "../super-admin/AbaCarteiraRede";
import AbaPremiosRede from "../super-admin/AbaPremiosRede";
import AbaVouchersRede from "../super-admin/AbaVouchersRede";
import { AbaCampanhas, AbaPostos } from "../super-admin/RedeDetalhesSecao";
import AppCardsRedeSecao from "./AppCardsRedeSecao";
import GestorRedeAuditoriaSecao from "./GestorRedeAuditoriaSecao";
import GestorRedeRelatoriosSecao from "./GestorRedeRelatoriosSecao";
import CombustiveisRedeSecao from "./CombustiveisRedeSecao";
import GestorGatewaysPagamentoSecao from "./GestorGatewaysPagamentoSecao";
import GestorConfiguracoesSecao from "./GestorConfiguracoesSecao";
import UsuariosPerfisPagina from "./usuarios-perfis/UsuariosPerfisPagina";
import SuperAdminDownloadsSecao from "../super-admin/SuperAdminDownloadsSecao";

function GestorConteudo({ rede, carregandoRede, onRedeRefresh }) {
  const { secao } = useParams();
  const menuConfig = menuPorId(MENUS_GESTOR_REDE, secao);
  const idsValidos = MENUS_GESTOR_REDE.map((m) => m.id);

  if (!idsValidos.includes(secao)) {
    return <Navigate to={`${PREFIXO_GESTOR}/${MENUS_GESTOR_REDE[0].id}`} replace />;
  }

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

  const id = menuConfig.id;

  switch (id) {
    case "usuarios-perfis":
      return <UsuariosPerfisPagina rede={rede} />;
    case "postos":
      return <AbaPostos redeId={rede.id} />;
    case "combustiveis":
      return <CombustiveisRedeSecao redeId={rede.id} />;
    case "campanhas":
      return <AbaCampanhas redeId={rede.id} />;
    case "carteira":
      return <AbaCarteiraRede rede={rede} onSalvo={onRedeRefresh} />;
    case "gateways-pagamento":
      return <GestorGatewaysPagamentoSecao rede={rede} />;
    case "vouchers":
      return <AbaVouchersRede rede={rede} onSalvo={onRedeRefresh} />;
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
    case "downloads":
      return <SuperAdminDownloadsSecao />;
    default:
      return null;
  }
}

function GestorShell({ sessao, onSair, itensMenu, rede, carregandoRede, onRedeRefresh }) {
  const { secao } = useParams();
  const menuConfig = menuPorId(MENUS_GESTOR_REDE, secao);
  const ocultarCabecalho = secao === "usuarios-perfis";
  const ocultarLinhaRede = secao === "usuarios-perfis" || secao === "gateways-pagamento";

  return (
    <PainelLayout
      titulo={menuConfig.titulo}
      subtitulo={menuConfig.subtitulo}
      usuario={sessao?.usuario}
      itensMenu={itensMenu}
      onSair={onSair}
      ocultarCabecalho={ocultarCabecalho}
    >
      <div className="painel-gestor-rede">
        {rede && !ocultarLinhaRede ? (
          <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
            <strong>{rede.nome_fantasia}</strong> — CNPJ {rede.cnpj || "—"}
          </p>
        ) : null}
        <GestorConteudo rede={rede} carregandoRede={carregandoRede} onRedeRefresh={onRedeRefresh} />
      </div>
    </PainelLayout>
  );
}

export default function DashboardGestorRedePagina({ sessao, onSair }) {
  const itensMenu = useMemo(() => menusComPath(MENUS_GESTOR_REDE, PREFIXO_GESTOR), []);
  const [rede, setRede] = useState(null);
  const [carregandoRede, setCarregandoRede] = useState(true);

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
    if (!isDesktop || !rede) return;
    void aplicarTituloDesktop(PAPEL_GESTOR_REDE, nomeRedeDisplay(rede));
  }, [rede]);

  return (
    <Routes>
      <Route index element={<Navigate to={MENUS_GESTOR_REDE[0].id} replace />} />
      <Route
        path=":secao"
        element={
          <GestorShell
            sessao={sessao}
            onSair={onSair}
            itensMenu={itensMenu}
            rede={rede}
            carregandoRede={carregandoRede}
            onRedeRefresh={onRedeRefresh}
          />
        }
      />
      <Route path="*" element={<Navigate to={MENUS_GESTOR_REDE[0].id} replace />} />
    </Routes>
  );
}
