import { useState } from "react";
import { enviarTesteDePushRede } from "../../servicos/pushFcmRedeServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

export default function GestorConfiguracoesSecao() {
  const [titulo, setTitulo] = useState("Teste de notificacao");
  const [corpo, setCorpo] = useState(
    "Mensagem de teste. Se o app estiver aberto, aparecera um aviso. Se fechou, a notificacao abre o app e o aviso."
  );
  const [enviando, setEnviando] = useState(false);

  async function onEnviarTeste(e) {
    e.preventDefault();
    if (enviando) {
      return;
    }
    setEnviando(true);
    try {
      const r = await enviarTesteDePushRede({ titulo, corpo });
      toastSucesso(
        `Teste enviado: ${r.enviados} com sucesso, ${r.falhas} falha(s) em ${r.tokensTentado} token(s) da rede.`
      );
    } catch (err) {
      toastErro(err?.message || "Falha ao enviar o teste.");
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="configuracoes-painel">
      <article className="card-resumo">
        <h3>Notificacoes no app (FCM)</h3>
        <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
          O envio usa os tokens dos <strong>clientes</strong> (app) vinculados a esta rede, com notificacoes
          permitidas. Texto personalizado abaixo. No celular, o app pode mostrar um dialogo (app aberto) ou
          notificacao na barra (em segundo plano / fechado); ao tocar, o mesmo resumo.
        </p>
        <form className="form-rede" onSubmit={onEnviarTeste}>
          <div className="form-rede__grid" style={{ gridTemplateColumns: "1fr" }}>
            <div>
              <label className="form-rede__label" htmlFor="fcm-titulo">
                Titulo
              </label>
              <input
                id="fcm-titulo"
                className="form-rede__input"
                type="text"
                value={titulo}
                onChange={(ev) => setTitulo(ev.target.value)}
                placeholder="Ex.: Ola da rede"
                maxLength={120}
                autoComplete="off"
              />
            </div>
            <div>
              <label className="form-rede__label" htmlFor="fcm-corpo">
                Corpo (mensagem)
              </label>
              <textarea
                id="fcm-corpo"
                className="form-rede__input"
                rows={4}
                value={corpo}
                onChange={(ev) => setCorpo(ev.target.value)}
                placeholder="Mensagem que o cliente le no celular"
                maxLength={2000}
              />
            </div>
          </div>
          <div className="form-rede__acoes" style={{ marginTop: 16 }}>
            <button
              className="botao-primario"
              type="submit"
              disabled={enviando}
            >
              {enviando ? "Enviando…" : "Enviar teste a todos os apps da rede"}
            </button>
          </div>
        </form>
      </article>
    </div>
  );
}
