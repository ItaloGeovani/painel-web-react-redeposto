import { Navigate, Outlet, useLocation } from "react-router-dom";
import { homePathPorPapel } from "../../constantes/rotas";

/**
 * Exige sessao e, opcionalmente, um dos papeis informados.
 * Se o papel nao bater, redireciona para a home daquele usuario (UX, nao seguranca).
 */
export default function ProtectedRoute({ sessao, papeisPermitidos = [] }) {
  const location = useLocation();

  if (!sessao) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const papel = sessao.usuario?.papel;
  if (papeisPermitidos.length > 0 && !papeisPermitidos.includes(papel)) {
    return <Navigate to={homePathPorPapel(papel)} replace />;
  }

  return <Outlet />;
}
