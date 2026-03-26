import { useState } from "react";
import BotaoPrimario from "../../componentes/BotaoPrimario";
import CampoTexto from "../../componentes/CampoTexto";
import { loginAdministrador } from "../../servicos/autenticacaoServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

export default function LoginPagina({ onLoginSucesso }) {
  const [email, setEmail] = useState("admin@gaspass.local");
  const [senha, setSenha] = useState("123456");
  const [carregando, setCarregando] = useState(false);

  async function handleSubmit(evento) {
    evento.preventDefault();
    setCarregando(true);

    try {
      const dados = await loginAdministrador(email, senha);
      const tokenRetornado = dados?.token || "";
      if (tokenRetornado) {
        localStorage.setItem("gaspass_token", tokenRetornado);
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
      <section className="card-login">
        <h1 className="titulo">GasPass</h1>
        <p className="subtitulo">Painel Administrativo</p>

        <form className="form-login" onSubmit={handleSubmit}>
          <CampoTexto
            id="email"
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            autoComplete="username"
          />

          <CampoTexto
            id="senha"
            label="Senha"
            type="password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            placeholder="******"
            autoComplete="current-password"
          />

          <BotaoPrimario type="submit" disabled={carregando}>
            {carregando ? "Entrando..." : "Entrar"}
          </BotaoPrimario>
        </form>
        <p className="observacao-login">
          O token de sessao e salvo localmente para acesso ao dashboard.
        </p>
      </section>
    </main>
  );
}
