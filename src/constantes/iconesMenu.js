import {
  Building2,
  ChartNoAxesColumn,
  Fuel,
  LayoutDashboard,
  Megaphone,
  Network,
  Settings,
  ShieldCheck,
  Ticket,
  Trophy,
  Users,
  Wallet,
  CreditCard,
  Smartphone,
  Image,
  ScanLine,
  Download
} from "lucide-react";

/** Mapa id do menu → ícone Lucide */
export const ICONES_MENU = {
  "visao-geral": LayoutDashboard,
  redes: Network,
  relatorios: ChartNoAxesColumn,
  auditoria: ShieldCheck,
  configuracoes: Settings,
  "configuracoes-do-sistema": Settings,
  downloads: Download,
  "usuarios-perfis": Users,
  postos: Building2,
  combustiveis: Fuel,
  campanhas: Megaphone,
  carteira: Wallet,
  "gateways-pagamento": CreditCard,
  vouchers: Ticket,
  "ler-voucher": ScanLine,
  "app-cards": Image,
  premios: Trophy,
  "app-movel": Smartphone
};

export function iconePorMenuId(id) {
  return ICONES_MENU[id] || LayoutDashboard;
}
