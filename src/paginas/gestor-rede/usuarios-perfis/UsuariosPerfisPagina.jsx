import { Users } from "lucide-react";
import PageHeader from "../../../componentes/ui/PageHeader";
import ClientActivitySection from "./ClientActivitySection";
import EquipeRedeSection from "./EquipeRedeSection";
import GestorRedeCard from "./GestorRedeCard";

export default function UsuariosPerfisPagina({ rede }) {
  const breadcrumb = [
    "Home",
    "Rede",
    rede?.nome_fantasia || "—",
    `CNPJ ${rede?.cnpj || "—"}`
  ];

  return (
    <div className="gp-usuarios-perfis">
      <PageHeader
        icon={Users}
        title="Usuarios e Perfis"
        subtitle="Gestao de usuarios, papeis e permissoes dentro da sua rede."
        breadcrumb={breadcrumb}
      />

      <GestorRedeCard rede={rede} />

      <ClientActivitySection redeId={rede.id} />

      <EquipeRedeSection redeId={rede.id} permiteEditarEquipe />
    </div>
  );
}
