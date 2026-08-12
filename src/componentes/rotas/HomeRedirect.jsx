import { Navigate } from "react-router-dom";
import { homePathPorPapel } from "../../constantes/rotas";

/** Redireciona / conforme sessao e papel. */
export default function HomeRedirect({ sessao }) {
  if (!sessao) {
    return <Navigate to="/login" replace />;
  }
  return <Navigate to={homePathPorPapel(sessao.usuario?.papel)} replace />;
}
