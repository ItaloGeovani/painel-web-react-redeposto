/**
 * Itens do menu lateral por papel.
 * `grupo` organiza a sidebar em secoes (usabilidade).
 * titulo/subtitulo alimentam o cabecalho ao trocar de secao.
 */

export const MENUS_GESTOR_REDE = [
  {
    id: "usuarios-perfis",
    nome: "Usuarios",
    titulo: "Usuarios e Perfis",
    subtitulo: "Gestao de usuarios, papeis e permissoes dentro da sua rede.",
    grupo: "Cadastros"
  },
  {
    id: "postos",
    nome: "Postos",
    titulo: "Postos",
    subtitulo: "Cadastro e operacao dos postos vinculados a rede.",
    grupo: "Cadastros"
  },
  {
    id: "combustiveis",
    nome: "Combustiveis",
    titulo: "Combustiveis",
    subtitulo: "Cadastro de combustiveis e preco por litro de referencia na rede.",
    grupo: "Cadastros"
  },
  {
    id: "campanhas",
    nome: "Campanhas",
    titulo: "Campanhas",
    subtitulo: "Campanhas e promocoes da rede.",
    grupo: "App e fidelidade"
  },
  {
    id: "vouchers",
    nome: "Vouchers",
    titulo: "Vouchers",
    subtitulo: "Prazos da compra PIX, configuracao e acompanhamento de vouchers no app.",
    grupo: "App e fidelidade"
  },
  {
    id: "premios",
    nome: "Premios",
    titulo: "Premios",
    subtitulo: "Catalogo de premios resgataveis com moeda da rede.",
    grupo: "App e fidelidade"
  },
  {
    id: "app-cards",
    nome: "Cards do app",
    titulo: "Cards do app",
    subtitulo: "Destaque da rede e tres promocoes no aplicativo do cliente (imagens e links).",
    grupo: "App e fidelidade"
  },
  {
    id: "carteira",
    nome: "Carteira",
    titulo: "Carteira e Financeiro",
    subtitulo: "Saldos, moeda virtual e visao financeira da rede.",
    grupo: "Financeiro"
  },
  {
    id: "gateways-pagamento",
    nome: "Pagamentos",
    titulo: "Gateways de pagamento",
    subtitulo: "Credenciais e webhooks para receber pagamentos (PIX, etc.).",
    grupo: "Financeiro"
  },
  {
    id: "relatorios",
    nome: "Relatorios",
    titulo: "Relatorios",
    subtitulo: "Relatorios gerenciais e operacionais da rede.",
    grupo: "Gestao"
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    titulo: "Auditoria",
    subtitulo: "Logs e trilha de auditoria dos eventos da rede.",
    grupo: "Gestao"
  },
  {
    id: "configuracoes",
    nome: "Configuracoes",
    titulo: "Configuracoes",
    subtitulo: "Ferramentas e testes, incluindo notificacoes push no app.",
    grupo: "Gestao"
  },
  {
    id: "downloads",
    nome: "Baixar PDV",
    titulo: "Baixar GasPass PDV",
    subtitulo: "Instalador Windows do aplicativo de balcão (desktop).",
    grupo: "Gestao"
  }
];

/** Gerente ja esta vinculado a um posto: sem menu Postos; demais alinhados ao gestor da rede. */
export const MENUS_GERENTE_POSTO = [
  {
    id: "usuarios-perfis",
    nome: "Usuarios",
    titulo: "Usuarios e Perfis",
    subtitulo: "Clientes da rede e equipe do seu posto.",
    grupo: "Cadastros"
  },
  {
    id: "combustiveis",
    nome: "Combustiveis",
    titulo: "Combustiveis",
    subtitulo: "Combustiveis e preco por litro de referencia (mesmo catalogo da rede).",
    grupo: "Cadastros"
  },
  {
    id: "campanhas",
    nome: "Campanhas",
    titulo: "Campanhas",
    subtitulo: "Campanhas e promocoes da rede.",
    grupo: "App e fidelidade"
  },
  {
    id: "vouchers",
    nome: "Vouchers",
    titulo: "Vouchers",
    subtitulo: "Emissao, uso e acompanhamento de vouchers.",
    grupo: "App e fidelidade"
  },
  {
    id: "premios",
    nome: "Premios",
    titulo: "Premios",
    subtitulo: "Catalogo de premios resgataveis com moeda da rede.",
    grupo: "App e fidelidade"
  },
  {
    id: "app-cards",
    nome: "Cards do app",
    titulo: "Cards do app",
    subtitulo: "Destaque da rede e tres promocoes no aplicativo do cliente (imagens e links).",
    grupo: "App e fidelidade"
  },
  {
    id: "carteira",
    nome: "Carteira",
    titulo: "Carteira e Financeiro",
    subtitulo: "Moeda virtual e visao financeira da rede (leitura; edicao pelo gestor da rede).",
    grupo: "Financeiro"
  },
  {
    id: "gateways-pagamento",
    nome: "Pagamentos",
    titulo: "Gateways de pagamento",
    subtitulo: "Mercado Pago do seu posto (quando a rede usa conta por unidade).",
    grupo: "Financeiro"
  },
  {
    id: "relatorios",
    nome: "Relatorios",
    titulo: "Relatorios",
    subtitulo: "Relatorios gerenciais e operacionais da rede.",
    grupo: "Gestao"
  },
  {
    id: "auditoria",
    nome: "Auditoria",
    titulo: "Auditoria",
    subtitulo: "Logs e trilha de auditoria dos eventos da rede.",
    grupo: "Gestao"
  },
  {
    id: "configuracoes",
    nome: "Configuracoes",
    titulo: "Configuracoes",
    subtitulo: "Ferramentas e testes, incluindo notificacoes push no app.",
    grupo: "Gestao"
  },
  {
    id: "downloads",
    nome: "Baixar PDV",
    titulo: "Baixar GasPass PDV",
    subtitulo: "Instalador Windows do aplicativo de balcão (desktop).",
    grupo: "Gestao"
  }
];

export const MENUS_FRENTISTA = [
  {
    id: "ler-voucher",
    nome: "Validar voucher",
    titulo: "Validar voucher",
    subtitulo: "Digite o codigo do cliente para consultar e registrar o uso.",
    grupo: "Operacao"
  },
  {
    id: "premios",
    nome: "Premios",
    titulo: "Premios resgatados",
    subtitulo: "Entregue premios resgatados pelos clientes no posto.",
    grupo: "Operacao"
  },
  {
    id: "campanhas",
    nome: "Campanhas",
    titulo: "Campanhas",
    subtitulo: "Campanhas ativas e regras em vigor.",
    grupo: "Operacao"
  },
  {
    id: "vouchers",
    nome: "Historico",
    titulo: "Historico de vouchers",
    subtitulo: "Historico de vouchers da rede.",
    grupo: "Operacao"
  },
  {
    id: "relatorios",
    nome: "Relatorios",
    titulo: "Relatorios",
    subtitulo: "Baixas do frentista autenticado por codigo e senha.",
    grupo: "Operacao"
  },
  {
    id: "downloads",
    nome: "Baixar PDV",
    titulo: "Baixar GasPass PDV",
    subtitulo: "Instalador Windows do aplicativo de balcão (desktop).",
    grupo: "Operacao",
    /** Só no painel web — no Tauri o app já está instalado. */
    somenteWeb: true
  }
];

/**
 * Agrupa itens de menu pela propriedade `grupo`, preservando a ordem.
 * Itens sem grupo entram em um bloco unico sem titulo.
 */
export function agruparMenus(itens = []) {
  const grupos = [];
  const mapa = new Map();

  for (const item of itens) {
    const chave = item.grupo || "";
    if (!mapa.has(chave)) {
      const bloco = { grupo: chave || null, itens: [] };
      mapa.set(chave, bloco);
      grupos.push(bloco);
    }
    mapa.get(chave).itens.push(item);
  }

  return grupos;
}
