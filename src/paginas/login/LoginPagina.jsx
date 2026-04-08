import { useEffect, useState } from "react";
import BotaoPrimario from "../../componentes/BotaoPrimario";
import CampoTexto from "../../componentes/CampoTexto";
import { loginPainel } from "../../servicos/autenticacaoServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

const LEMBRAR_KEY = "gaspass_lembrar_email";
const EMAIL_SALVO_KEY = "gaspass_email_salvo";

function IconeEnvelope() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M4 6h16v12H4V6zm0 0l8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconeCadeado() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect
        x="5"
        y="11"
        width="14"
        height="10"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 11V8a4 4 0 0 1 8 0v3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

function LogoGasPass() {
  return (
    <div className="login-marca">
      <img
        className="login-marca__img"
        src="/img/logo.png"
        alt="GasPass"
        decoding="async"
      />
    </div>
  );
}

export default function LoginPagina({ onLoginSucesso }) {
  const [email, setEmail] = useState("admin@gaspass.local");
  const [senha, setSenha] = useState("123456");
  const [carregando, setCarregando] = useState(false);
  const [lembrarMe, setLembrarMe] = useState(false);

  useEffect(() => {
    try {
      if (localStorage.getItem(LEMBRAR_KEY) === "1") {
        const salvo = localStorage.getItem(EMAIL_SALVO_KEY);
        if (salvo) setEmail(salvo);
        setLembrarMe(true);
      }
    } catch {
      /* ignore */
    }
  }, []);

  async function handleSubmit(evento) {
    evento.preventDefault();
    setCarregando(true);

    try {
      const dados = await loginPainel(email, senha);
      const tokenRetornado = dados?.token || "";
      if (tokenRetornado) {
        localStorage.setItem("gaspass_token", tokenRetornado);
      }

      try {
        if (lembrarMe) {
          localStorage.setItem(LEMBRAR_KEY, "1");
          localStorage.setItem(EMAIL_SALVO_KEY, email);
        } else {
          localStorage.removeItem(LEMBRAR_KEY);
          localStorage.removeItem(EMAIL_SALVO_KEY);
        }
      } catch {
        /* ignore */
      }

      if (onLoginSucesso) {
        onLoginSucesso({
          token: tokenRetornado,
          usuario: dados?.sessao || null
        });
      }

      toastSucesso("Login realizado com sucesso.");
    } catch (err) {
      toastErro(err.message || "Nao foi possivel fazer login.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <main className="layout-login">
      <section className="login-card" aria-label="Login GasPass">
        <div className="login-card__hero">
          <img
            className="login-card__hero-img"
            src="/img/posto.png"
            alt=""
            decoding="async"
          />
          <div className="login-card__hero-overlay">
            <p>GasPass: Gestão Inteligente para sua Rede</p>
          </div>
        </div>

        <div className="login-card__painel">
          <header className="login-cabecalho">
            <LogoGasPass />
            <p className="login-cabecalho__sub">Painel Administrativo</p>
          </header>

          <form className="form-login" onSubmit={handleSubmit}>
            <CampoTexto
              id="email"
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gaspass.local"
              autoComplete="username"
              className="campo--login-email"
              iconePrefixo={<IconeEnvelope />}
            />

            <CampoTexto
              id="senha"
              label="Senha"
              type="password"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              placeholder="•••••••"
              autoComplete="current-password"
              className="campo--login-senha"
              iconePrefixo={<IconeCadeado />}
            />

            <div className="login-recursos">
              <span className="login-recursos__titulo">Recursos</span>
              <div className="login-recursos__linha">
                <label className="login-lembrar">
                  <input
                    type="checkbox"
                    checked={lembrarMe}
                    onChange={(e) => setLembrarMe(e.target.checked)}
                  />
                  <span>Lembrar-me</span>
                </label>
                <a
                  className="login-esqueci"
                  href="#"
                  onClick={(e) => e.preventDefault()}
                >
                  Esqueceu sua senha?
                </a>
              </div>
            </div>

            <BotaoPrimario type="submit" disabled={carregando}>
              {carregando ? "Entrando..." : "Entrar"}
            </BotaoPrimario>
          </form>

          <p className="observacao-login">
            O token de sessão é salvo localmente para acesso ao dashboard.
          </p>
        </div>
      </section>
    </main>
  );
}
