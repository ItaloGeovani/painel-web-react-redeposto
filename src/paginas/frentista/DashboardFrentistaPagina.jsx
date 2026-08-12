import { useCallback, useEffect, useMemo, useState } from "react";
import { Navigate, Route, Routes, useParams } from "react-router-dom";
import PainelLayout from "../../componentes/layout/PainelLayout";
import DesktopLayout from "../../layouts/DesktopLayout";
import { isDesktop } from "../../configuracao/appTarget";
import { MENUS_FRENTISTA } from "../../constantes/menusPorPapel";
import {
  PREFIXO_FRENTISTA,
  menuPorId,
  menusComPath
} from "../../constantes/rotas";
import { buscarMinhaRedeGestor } from "../../servicos/redesServico";
import { listarPostosRede } from "../../servicos/postosServico";
import { toastErro } from "../../servicos/toastServico";
import AbaVouchersRede from "../super-admin/AbaVouchersRede";
import { AbaCampanhas } from "../super-admin/RedeDetalhesSecao";
import FrentistaValidarVoucherSecao from "./FrentistaValidarVoucherSecao";
import FrentistaRelatoriosSecao from "./FrentistaRelatoriosSecao";
import AbaPremiosRede from "../super-admin/AbaPremiosRede";
import SuperAdminDownloadsSecao from "../super-admin/SuperAdminDownloadsSecao";

function menusFrentistaVisiveis() {
  if (isDesktop) {
    return MENUS_FRENTISTA.filter((m) => !m.somenteWeb);
  }
  return MENUS_FRENTISTA;
}

function FrentistaConteudo({ rede, carregandoRede, onRedeRefresh }) {
  const { secao } = useParams();
  const menus = menusFrentistaVisiveis();
  const menuConfig = menuPorId(menus, secao);
  const idsValidos = menus.map((m) => m.id);

  if (!idsValidos.includes(secao)) {
    return <Navigate to={`${PREFIXO_FRENTISTA}/${menus[0].id}`} replace />;
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
        <p>Verifique se o usuario esta vinculado a uma rede ou faca login novamente.</p>
      </article>
    );
  }

  const id = menuConfig.id;

  switch (id) {
    case "ler-voucher":
      return <FrentistaValidarVoucherSecao rede={rede} />;
    case "premios":
      return (
        <AbaPremiosRede
          redeId={rede.id}
          somenteResgates
          podeCancelar={false}
          podeEditarCatalogo={false}
        />
      );
    case "campanhas":
      return <AbaCampanhas redeId={rede.id} somenteLeitura />;
    case "vouchers":
      return <AbaVouchersRede rede={rede} />;
    case "relatorios":
      return <FrentistaRelatoriosSecao />;
    case "downloads":
      return <SuperAdminDownloadsSecao />;
    default:
      return null;
  }
}

function FrentistaShell({
  sessao,
  onSair,
  itensMenu,
  rede,
  postoNome,
  carregandoRede,
  onRedeRefresh
}) {
  const { secao } = useParams();
  const menus = menusFrentistaVisiveis();
  const menuConfig = menuPorId(menus, secao);

  const ocultarLinhaRede = secao === "ler-voucher";

  const conteudo = (
    <div className={isDesktop ? "gp-pdv-conteudo" : "painel-gestor-rede"}>
      {rede && !ocultarLinhaRede && !isDesktop ? (
        <p className="rede-detalhes__ajuda" style={{ marginBottom: 12 }}>
          <strong>{rede.nome_fantasia}</strong> — CNPJ {rede.cnpj || "—"}
        </p>
      ) : null}
      <FrentistaConteudo
        rede={rede}
        carregandoRede={carregandoRede}
        onRedeRefresh={onRedeRefresh}
      />
    </div>
  );

  if (isDesktop) {
    return (
      <DesktopLayout
        usuario={sessao?.usuario}
        postoNome={postoNome}
        rede={rede}
        itensMenu={itensMenu}
        onSair={onSair}
      >
        {conteudo}
      </DesktopLayout>
    );
  }

  return (
    <PainelLayout
      titulo={menuConfig.titulo}
      subtitulo={menuConfig.subtitulo}
      usuario={sessao?.usuario}
      itensMenu={itensMenu}
      onSair={onSair}
    >
      {conteudo}
    </PainelLayout>
  );
}

export default function DashboardFrentistaPagina({ sessao, onSair }) {
  const itensMenu = useMemo(
    () => menusComPath(menusFrentistaVisiveis(), PREFIXO_FRENTISTA),
    []
  );
  const [rede, setRede] = useState(null);
  const [postoNome, setPostoNome] = useState("");
  const [carregandoRede, setCarregandoRede] = useState(true);

  const carregarContexto = useCallback(async () => {
    const r = await buscarMinhaRedeGestor();
    let nomePosto = "";
    const idPosto = String(sessao?.usuario?.id_posto || "").trim();
    if (idPosto && r?.id) {
      try {
        const postos = await listarPostosRede(r.id);
        const posto = postos.find((p) => String(p.id) === idPosto);
        nomePosto = posto?.nome_fantasia || posto?.nome || "";
      } catch {
        nomePosto = "";
      }
    }
    return { rede: r, postoNome: nomePosto };
  }, [sessao?.usuario?.id_posto]);

  const onRedeRefresh = useCallback(async () => {
    try {
      const { rede: r, postoNome: nome } = await carregarContexto();
      setRede(r);
      setPostoNome(nome);
    } catch (err) {
      toastErro(err.message || "Falha ao atualizar dados da rede.");
    }
  }, [carregarContexto]);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCarregandoRede(true);
      try {
        const { rede: r, postoNome: nome } = await carregarContexto();
        if (!cancelado) {
          setRede(r);
          setPostoNome(nome);
        }
      } catch (err) {
        if (!cancelado) {
          toastErro(err.message || "Falha ao carregar dados da rede.");
          setRede(null);
          setPostoNome("");
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
  }, [carregarContexto]);

  return (
    <Routes>
      <Route index element={<Navigate to={menusFrentistaVisiveis()[0].id} replace />} />
      <Route
        path=":secao"
        element={
          <FrentistaShell
            sessao={sessao}
            onSair={onSair}
            itensMenu={itensMenu}
            rede={rede}
            postoNome={postoNome}
            carregandoRede={carregandoRede}
            onRedeRefresh={onRedeRefresh}
          />
        }
      />
      <Route path="*" element={<Navigate to={menusFrentistaVisiveis()[0].id} replace />} />
    </Routes>
  );
}
