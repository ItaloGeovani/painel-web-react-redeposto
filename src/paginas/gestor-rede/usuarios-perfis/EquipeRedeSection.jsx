import { useMemo } from "react";
import Card from "../../../componentes/ui/Card";
import { ListaUsuariosRedePaginada } from "../../super-admin/RedeDetalhesSecao";

export default function EquipeRedeSection({ redeId, permiteEditarEquipe = true }) {
  const titulo = useMemo(() => "Equipe dos postos", []);

  return (
    <Card className="gp-section-card" padding>
      <div className="gp-section-card__head">
        <div>
          <h3 className="gp-section-card__title">{titulo}</h3>
          <p className="gp-section-card__desc">
            Gerentes de posto e frentistas vinculados aos postos da rede.
          </p>
        </div>
      </div>
      <ListaUsuariosRedePaginada
        redeId={redeId}
        papeis="gerente_posto,frentista"
        permiteEditarEquipe={permiteEditarEquipe}
      />
    </Card>
  );
}
