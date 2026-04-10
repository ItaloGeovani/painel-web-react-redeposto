import { useEffect, useState } from "react";
import { obterConfiguracaoSistema } from "../../servicos/adminPlataformaServico";
import { toastErro } from "../../servicos/toastServico";
import SuperAdminAppMobileConfigForm from "./SuperAdminAppMobileConfigForm";

export default function SuperAdminConfiguracaoSecao() {
  const [cfg, setCfg] = useState(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let cancelado = false;
    (async () => {
      setCarregando(true);
      try {
        const c = await obterConfiguracaoSistema();
        if (!cancelado) {
          setCfg(c);
        }
      } catch (err) {
        if (!cancelado) {
          toastErro(err.message || "Falha ao carregar configuracao.");
          setCfg(null);
        }
      } finally {
        if (!cancelado) {
          setCarregando(false);
        }
      }
    })();
    return () => {
      cancelado = true;
    };
  }, []);

  if (carregando) {
    return (
      <article className="card-resumo">
        <p>Carregando parametros do servidor...</p>
      </article>
    );
  }

  if (!cfg) {
    return (
      <article className="card-resumo">
        <strong>Nao foi possivel carregar</strong>
        <p>Tente novamente em instantes.</p>
      </article>
    );
  }

  return (
    <div className="gestor-relatorios">
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Parametros <strong>somente leitura</strong> expostos pela API (sem segredos). Alteracoes sao feitas por variaveis de
        ambiente no servidor e reinicio do processo.
      </p>

      <div className="grid-resumo">
        <article className="card-resumo">
          <h3>Ambiente</h3>
          <strong>{String(cfg.ambiente || "—")}</strong>
          <p>Ex.: desenvolvimento, producao (APP_AMBIENTE).</p>
        </article>
        <article className="card-resumo">
          <h3>Porta HTTP</h3>
          <strong className="tabela-num">{cfg.porta_http ?? "—"}</strong>
          <p>Porta em que o servidor Go escuta (APP_PORTA).</p>
        </article>
        <article className="card-resumo">
          <h3>CORS</h3>
          <strong style={{ wordBreak: "break-all" }}>{String(cfg.cors_origem_permitida || "—")}</strong>
          <p>Origem permitida para chamadas do navegador (CORS_ORIGEM_PERMITIDA).</p>
        </article>
        <article className="card-resumo">
          <h3>Bootstrap admin</h3>
          <strong>{cfg.admin_bootstrap_ativado ? "Ativo" : "Inativo"}</strong>
          <p>
            Quando ativo, o servidor pode criar o administrador padrao se nao existir (ADMIN_BOOTSTRAP_ATIVADO).
          </p>
        </article>
      </div>

      <SuperAdminAppMobileConfigForm />
    </div>
  );
}
