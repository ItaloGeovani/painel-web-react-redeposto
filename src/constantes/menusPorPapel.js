/**
 * Itens do menu lateral por papel (strings iguais ao exibido no UI).
 * titulo/subtitulo alimentam o cabecalho ao trocar de secao.
 */

export const MENUS_GESTOR_REDE = [
  {
    id: "usuarios-perfis",
    nome: "Usuarios e Perfis",
    titulo: "Usuarios e Perfis",
    subtitulo: "Gestao de usuarios, papeis e permissoes dentro da sua rede."
  },
  {
    id: "postos",
    nome: "Postos",
    titulo: "Postos",
    subtitulo: "Cadastro e operacao dos postos vinculados a rede."
  },
  {
    id: "combustiveis",
    nome: "Combustiveis",
    titulo: "Combustiveis",
    subtitulo: "Cadastro de combustiveis e preco por litro de referencia na rede."
  },
  {
    id: "campanhas",
    nome: "Campanhas",
    titulo: "Campanhas",
    subtitulo: "Campanhas e promocoes da rede."
  },
  {
    id: "carteira",
    nome: "Carteira e Financeiro",
    titulo: "Carteira e Financeiro",
    subtitulo: "Saldos, moeda virtual e visao financeira da rede."
  },
  {
    id: "gateways-pagamento",
    nome: "Gateways de pagamento",
    titulo: "Gateways de pagamento",
    subtitulo: "Credenciais e webhooks para receber pagamentos (PIX, etc.)."
  },
  {
    id: "vouchers",
    nome: "Vouchers",
    titulo: "Vouchers",
    subtitulo: "Prazos da compra PIX, configuracao e acompanhamento de vouchers no app."
  },
  {
    id: "app-cards",
    nome: "Cards do app",
    titulo: "Cards do app",
    subtitulo: "Destaque da rede e tres promocoes no aplicativo do cliente (imagens e links)."
  },
  {
    id: "premios",
    nome: "Premios",
    titulo: "Premios",
    subtitulo: "Catalogo de premios resgataveis com moeda da rede."
  },
  {
    id: "relatorios",
    nome: "Relatorios",
    titulo: "Relatorios",
    subtitulo: "Relatorios gerenciais e operacionais da rede."
  },
  {
    id: "configuracoes",
    nome: "Configuracoes",
    titulo: "Configuracoes",
    subtitulo: "Ferramentas e testes, incluindo notificacoes push no app."
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    titulo: "Auditoria",
    subtitulo: "Logs e trilha de auditoria dos eventos da rede."
  }
];

/** Gerente ja esta vinculado a um posto: sem menu Postos; demais alinhados ao gestor da rede. */
export const MENUS_GERENTE_POSTO = [
  {
    id: "usuarios-perfis",
    nome: "Usuarios e Perfis",
    titulo: "Usuarios e Perfis",
    subtitulo: "Clientes da rede e equipe do seu posto."
  },
  {
    id: "campanhas",
    nome: "Campanhas",
    titulo: "Campanhas",
    subtitulo: "Campanhas e promocoes da rede."
  },
  {
    id: "combustiveis",
    nome: "Combustiveis",
    titulo: "Combustiveis",
    subtitulo: "Combustiveis e preco por litro de referencia (mesmo catalogo da rede)."
  },
  {
    id: "carteira",
    nome: "Carteira e Financeiro",
    titulo: "Carteira e Financeiro",
    subtitulo: "Moeda virtual e visao financeira da rede (leitura; edicao pelo gestor da rede)."
  },
  {
    id: "vouchers",
    nome: "Vouchers",
    titulo: "Vouchers",
    subtitulo: "Emissao, uso e acompanhamento de vouchers."
  },
  {
    id: "app-cards",
    nome: "Cards do app",
    titulo: "Cards do app",
    subtitulo: "Destaque da rede e tres promocoes no aplicativo do cliente (imagens e links)."
  },
  {
    id: "premios",
    nome: "Premios",
    titulo: "Premios",
    subtitulo: "Catalogo de premios resgataveis com moeda da rede."
  },
  {
    id: "relatorios",
    nome: "Relatorios",
    titulo: "Relatorios",
    subtitulo: "Relatorios gerenciais e operacionais da rede."
  },
  {
    id: "configuracoes",
    nome: "Configuracoes",
    titulo: "Configuracoes",
    subtitulo: "Ferramentas e testes, incluindo notificacoes push no app."
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    titulo: "Auditoria",
    subtitulo: "Logs e trilha de auditoria dos eventos da rede."
  }
];

export const MENUS_FRENTISTA = [
  {
    id: "campanhas",
    nome: "Campanhas",
    titulo: "Campanhas",
    subtitulo: "Campanhas ativas e regras em vigor."
  },
  {
    id: "carteira",
    nome: "Carteira e Financeiro",
    titulo: "Carteira e Financeiro",
    subtitulo: "Consulta de saldo e movimentacoes."
  },
  {
    id: "vouchers",
    nome: "Vouchers",
    titulo: "Vouchers",
    subtitulo: "Validacao e historico de vouchers."
  },
  {
    id: "relatorios",
    nome: "Relatorios",
    titulo: "Relatorios",
    subtitulo: "Relatorios do seu turno e operacao."
  }
];
