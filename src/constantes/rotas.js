import {
  PAPEL_FRENTISTA,
  PAPEL_GERENTE_POSTO,
  PAPEL_GESTOR_REDE,
  PAPEL_SUPER_ADMIN
} from "./papeis";
import { MENUS_FRENTISTA, MENUS_GERENTE_POSTO, MENUS_GESTOR_REDE } from "./menusPorPapel";

export const MENUS_SUPER_ADMIN = [
  {
    id: "visao-geral",
    nome: "Visao Geral",
    titulo: "Dashboard do Administrador Global",
    subtitulo: "Visao consolidada da plataforma para decisoes rapidas.",
    grupo: "Principal"
  },
  {
    id: "redes",
    nome: "Redes",
    titulo: "Gestao de Redes",
    subtitulo:
      "Use Gerenciar para o painel da rede: postos, equipe por posto, gestor, clientes, campanhas, carteira, premios e vouchers.",
    grupo: "Principal"
  },
  {
    id: "relatorios",
    nome: "Relatorios",
    titulo: "Relatorios",
    subtitulo: "Relatorios gerenciais, operacionais e financeiros da plataforma.",
    grupo: "Sistema"
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    titulo: "Auditoria e Logs",
    subtitulo: "Trilha de auditoria de eventos criticos e acoes administrativas.",
    grupo: "Sistema"
  },
  {
    id: "configuracoes",
    nome: "Configuracoes",
    titulo: "Configuracoes do Sistema",
    subtitulo: "Parametros globais, identidade visual e integracoes.",
    grupo: "Sistema"
  },
  {
    id: "downloads",
    nome: "Downloads",
    titulo: "Downloads — GasPass PDV",
    subtitulo: "Instalador e versao publicada do aplicativo desktop.",
    grupo: "Sistema"
  }
];

export const PREFIXO_ADMIN = "/admin";
export const PREFIXO_GESTOR = "/gestor";
export const PREFIXO_GERENTE = "/gerente";
export const PREFIXO_FRENTISTA = "/frentista";

export function homePathPorPapel(papel) {
  switch (papel) {
    case PAPEL_SUPER_ADMIN:
      return `${PREFIXO_ADMIN}/visao-geral`;
    case PAPEL_GESTOR_REDE:
      return `${PREFIXO_GESTOR}/${MENUS_GESTOR_REDE[0].id}`;
    case PAPEL_GERENTE_POSTO:
      return `${PREFIXO_GERENTE}/${MENUS_GERENTE_POSTO[0].id}`;
    case PAPEL_FRENTISTA:
      return `${PREFIXO_FRENTISTA}/${MENUS_FRENTISTA[0].id}`;
    default:
      return "/nao-suportado";
  }
}

export function prefixoPorPapel(papel) {
  switch (papel) {
    case PAPEL_SUPER_ADMIN:
      return PREFIXO_ADMIN;
    case PAPEL_GESTOR_REDE:
      return PREFIXO_GESTOR;
    case PAPEL_GERENTE_POSTO:
      return PREFIXO_GERENTE;
    case PAPEL_FRENTISTA:
      return PREFIXO_FRENTISTA;
    default:
      return null;
  }
}

export function menusComPath(menus, prefixo) {
  return menus.map((item) => ({
    ...item,
    path: `${prefixo}/${item.id}`
  }));
}

export function menuPorId(menus, id) {
  return menus.find((item) => item.id === id) || menus[0];
}

export function pathRedeDetalhe(redeId, aba) {
  const base = `${PREFIXO_ADMIN}/redes/${encodeURIComponent(redeId)}`;
  if (aba && aba !== "visao-geral") {
    return `${base}/${aba}`;
  }
  return base;
}
