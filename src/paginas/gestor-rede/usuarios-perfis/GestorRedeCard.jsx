import { useEffect, useMemo, useState } from "react";
import { listarGestoresRede } from "../../../servicos/gestoresServico";
import Badge from "../../../componentes/ui/Badge";
import Card from "../../../componentes/ui/Card";

function iniciais(nome) {
  const partes = String(nome || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (partes.length === 0) return "GR";
  if (partes.length === 1) return partes[0].slice(0, 2).toUpperCase();
  return `${partes[0][0]}${partes[partes.length - 1][0]}`.toUpperCase();
}

export default function GestorRedeCard({ rede }) {
  const [gestor, setGestor] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        const itens = await listarGestoresRede();
        const daRede = (itens || []).filter((g) => g.id_rede === rede?.id);
        const ativo = daRede.find((g) => g.ativo) || daRede[0] || null;
        if (!cancelado) setGestor(ativo);
      } catch {
        if (!cancelado) setGestor(null);
      } finally {
        if (!cancelado) setCarregando(false);
      }
    })();
    return () => {
      cancelado = true;
    };
  }, [rede?.id]);

  const nome = useMemo(() => gestor?.nome || "Gestor da rede", [gestor]);

  return (
    <Card accent className="gp-section-card" padding>
      {carregando ? (
        <p className="gp-gestor-card__sub">Carregando gestor...</p>
      ) : (
        <div className="gp-gestor-card">
          <div className="gp-gestor-card__pessoa">
            <div className="gp-avatar" aria-hidden>
              {iniciais(nome)}
            </div>
            <div>
              <span className="gp-gestor-card__label">Gestor da rede</span>
              <div className="gp-gestor-card__nome">
                <strong>{nome}</strong>
                <Badge variant={gestor?.ativo !== false ? "success" : "danger"}>
                  {gestor?.ativo !== false ? "Ativo" : "Inativo"}
                </Badge>
              </div>
            </div>
          </div>

          <div>
            <span className="gp-gestor-card__label">Rede</span>
            <div className="gp-gestor-card__valor">{rede?.nome_fantasia || "—"}</div>
            <p className="gp-gestor-card__sub">CNPJ {rede?.cnpj || "—"}</p>
          </div>

          <div>
            <span className="gp-gestor-card__label">Acesso</span>
            <div className="gp-gestor-card__valor">Painel administrativo</div>
            <p className="gp-gestor-card__sub">{gestor?.email || "Permissoes da rede"}</p>
          </div>
        </div>
      )}
    </Card>
  );
}
