import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  ChevronRight,
  Gift,
  Layers,
  Link2,
  MessageCircle,
  RotateCcw,
  Send,
  Settings2,
  SlidersHorizontal,
  Sparkles,
  Stethoscope,
  Trophy
} from "lucide-react";
import { gestorRedeLogado } from "../../configuracao/painelApi";
import { enviarTesteDePushRede, buscarDiagnosticoPushRede } from "../../servicos/pushFcmRedeServico";
import {
  buscarWhatsAppNotificacoes,
  salvarWhatsAppNotificacoes,
  enviarTesteWhatsApp
} from "../../servicos/whatsappNotificacoesServico";
import { atualizarAppModulosRede, buscarMinhaRedeGestor } from "../../servicos/redesServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import Badge from "../../componentes/ui/Badge";
import Button from "../../componentes/ui/Button";
import Card from "../../componentes/ui/Card";
import GestorIndiqueGanheSubsecao from "./GestorIndiqueGanheSubsecao";
import GestorCheckinDiarioSubsecao from "./GestorCheckinDiarioSubsecao";
import GestorGireGanheSubsecao from "./GestorGireGanheSubsecao";
import GestorNiveisClienteSubsecao from "./GestorNiveisClienteSubsecao";
import GestorRedesSociaisSubsecao from "./GestorRedesSociaisSubsecao";

const ABAS_CONFIG = [
  { id: "funcionalidades", label: "Funcionalidades", icon: Sparkles },
  { id: "niveis", label: "Níveis", icon: Trophy },
  { id: "ajustes", label: "Ajustes", icon: SlidersHorizontal },
  { id: "notificacoes", label: "Notificações", icon: Bell }
];

const MODULOS = [
  {
    key: "indique",
    titulo: "Indique e ganhe",
    desc: "Clientes convidam amigos e ganham recompensas.",
    icon: Gift
  },
  {
    key: "checkin",
    titulo: "Check-in diário",
    desc: "Recompensa por abrir o app todos os dias.",
    icon: RotateCcw
  },
  {
    key: "gire",
    titulo: "Gire e ganhe",
    desc: "Roleta com prêmios e custo em moedas.",
    icon: Layers
  },
  {
    key: "redesSociais",
    titulo: "Redes sociais",
    desc: "Atalhos para Instagram, WhatsApp e outros links.",
    icon: Link2
  }
];

function ToggleModulo({ icon: Icon, titulo, desc, checked, onChange }) {
  return (
    <label className={`gp-config__toggle ${checked ? "gp-config__toggle--on" : ""}`}>
      <span className="gp-config__toggle-icon" aria-hidden>
        <Icon size={18} />
      </span>
      <span className="gp-config__toggle-texto">
        <strong>{titulo}</strong>
        <small>{desc}</small>
      </span>
      <span className="gp-config__switch">
        <input type="checkbox" checked={checked} onChange={onChange} />
        <span className="gp-config__switch-track" aria-hidden />
      </span>
    </label>
  );
}

function AcaoCard({ icon: Icon, titulo, desc, badge, onClick, disabled = false }) {
  return (
    <button type="button" className="gp-config__acao" onClick={onClick} disabled={disabled}>
      <span className="gp-config__acao-icon" aria-hidden>
        <Icon size={18} />
      </span>
      <span className="gp-config__acao-texto">
        <strong>
          {titulo}
          {badge ? (
            <Badge variant="success" className="gp-config__acao-badge">
              {badge}
            </Badge>
          ) : null}
        </strong>
        <small>{desc}</small>
      </span>
      <ChevronRight size={18} className="gp-config__acao-chevron" aria-hidden />
    </button>
  );
}

export default function GestorConfiguracoesSecao() {
  const [subSecao, setSubSecao] = useState(null);
  const [abaConfig, setAbaConfig] = useState("funcionalidades");
  const [titulo, setTitulo] = useState("Teste de notificacao");
  const [corpo, setCorpo] = useState(
    "Mensagem de teste. Se o app estiver aberto, aparecera um aviso. Se fechou, a notificacao abre o app e o aviso."
  );
  const [enviando, setEnviando] = useState(false);
  const [diagCarregando, setDiagCarregando] = useState(false);
  const [diagPayload, setDiagPayload] = useState(null);

  const [waCarregando, setWaCarregando] = useState(false);
  const [waSalvando, setWaSalvando] = useState(false);
  const [waTestando, setWaTestando] = useState(false);
  const [waBaseSet, setWaBaseSet] = useState(false);
  const [waHabilitado, setWaHabilitado] = useState(false);
  const [waInstanceName, setWaInstanceName] = useState("");
  const [waToken, setWaToken] = useState("");
  const [waTokenMasked, setWaTokenMasked] = useState("");
  const [waGroupJid, setWaGroupJid] = useState("");
  const [waNotifyGerado, setWaNotifyGerado] = useState(true);
  const [waNotifyPago, setWaNotifyPago] = useState(true);
  const [waNotifyBaixa, setWaNotifyBaixa] = useState(true);
  const [waNotifyCampanha, setWaNotifyCampanha] = useState(true);

  const [redeCarregada, setRedeCarregada] = useState(false);
  const [modIndique, setModIndique] = useState(false);
  const [modCheckin, setModCheckin] = useState(false);
  const [modGire, setModGire] = useState(false);
  const [modRedesSociais, setModRedesSociais] = useState(false);
  const [salvandoModulos, setSalvandoModulos] = useState(false);

  const carregarModulos = useCallback(async () => {
    if (!gestorRedeLogado()) {
      setRedeCarregada(true);
      return;
    }
    try {
      const r = await buscarMinhaRedeGestor();
      if (r) {
        setModIndique(!!r.app_modulo_indique_ganhe);
        setModCheckin(!!r.app_modulo_checkin_diario);
        setModGire(!!r.app_modulo_gire_ganhe);
        setModRedesSociais(!!r.app_modulo_redes_sociais);
      }
    } catch (err) {
      toastErro(err?.message || "Falha ao carregar módulos do app.");
    } finally {
      setRedeCarregada(true);
    }
  }, []);

  useEffect(() => {
    carregarModulos();
  }, [carregarModulos]);

  const carregarWhatsApp = useCallback(async () => {
    if (!gestorRedeLogado()) return;
    setWaCarregando(true);
    try {
      const dados = await buscarWhatsAppNotificacoes();
      const c = dados?.config ?? {};
      setWaBaseSet(!!dados?.evolution_base_url_set);
      setWaHabilitado(!!c.habilitado);
      setWaInstanceName(c.instance_name || "");
      setWaToken("");
      setWaTokenMasked(c.instance_token_masked || "");
      setWaGroupJid(c.group_jid || "");
      setWaNotifyGerado(c.notify_voucher_gerado !== false);
      setWaNotifyPago(c.notify_voucher_pago !== false);
      setWaNotifyBaixa(c.notify_voucher_baixa !== false);
      setWaNotifyCampanha(c.notify_campanha !== false);
    } catch (err) {
      toastErro(err?.message || "Falha ao carregar WhatsApp.");
    } finally {
      setWaCarregando(false);
    }
  }, []);

  useEffect(() => {
    if (gestorRedeLogado() && abaConfig === "notificacoes") {
      carregarWhatsApp();
    }
  }, [abaConfig, carregarWhatsApp]);

  async function onSalvarWhatsApp(e) {
    e.preventDefault();
    if (waSalvando) return;
    setWaSalvando(true);
    try {
      const payload = {
        habilitado: waHabilitado,
        instance_name: waInstanceName,
        group_jid: waGroupJid,
        notify_voucher_gerado: waNotifyGerado,
        notify_voucher_pago: waNotifyPago,
        notify_voucher_baixa: waNotifyBaixa,
        notify_campanha: waNotifyCampanha
      };
      if (String(waToken || "").trim()) {
        payload.instance_token = String(waToken).trim();
      }
      const dados = await salvarWhatsAppNotificacoes(payload);
      const c = dados?.config ?? {};
      setWaToken("");
      setWaTokenMasked(c.instance_token_masked || waTokenMasked);
      toastSucesso("Configuração WhatsApp salva.");
    } catch (err) {
      toastErro(err?.message || "Falha ao salvar WhatsApp.");
    } finally {
      setWaSalvando(false);
    }
  }

  async function onTesteWhatsApp() {
    if (waTestando) return;
    setWaTestando(true);
    try {
      await enviarTesteWhatsApp();
      toastSucesso("Mensagem de teste enviada ao grupo.");
    } catch (err) {
      toastErro(err?.message || "Falha no teste WhatsApp.");
    } finally {
      setWaTestando(false);
    }
  }

  const estadosModulo = useMemo(
    () => ({
      indique: { checked: modIndique, set: setModIndique, sub: "indique" },
      checkin: { checked: modCheckin, set: setModCheckin, sub: "checkin" },
      gire: { checked: modGire, set: setModGire, sub: "gire" },
      redesSociais: { checked: modRedesSociais, set: setModRedesSociais, sub: "redesSociais" }
    }),
    [modIndique, modCheckin, modGire, modRedesSociais]
  );

  const ativosCount = useMemo(
    () => [modIndique, modCheckin, modGire, modRedesSociais].filter(Boolean).length,
    [modIndique, modCheckin, modGire, modRedesSociais]
  );

  async function onSalvarModulos(e) {
    e.preventDefault();
    if (salvandoModulos) return;
    setSalvandoModulos(true);
    try {
      await atualizarAppModulosRede({
        app_modulo_indique_ganhe: modIndique,
        app_modulo_checkin_diario: modCheckin,
        app_modulo_gire_ganhe: modGire,
        app_modulo_redes_sociais: modRedesSociais
      });
      toastSucesso("Módulos do app atualizados.");
    } catch (err) {
      toastErro(err?.message || "Falha ao salvar.");
    } finally {
      setSalvandoModulos(false);
    }
  }

  async function onEnviarTeste(e) {
    e.preventDefault();
    if (enviando) return;
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

  async function onDiagnosticoPush() {
    if (diagCarregando) return;
    setDiagCarregando(true);
    setDiagPayload(null);
    try {
      const d = await buscarDiagnosticoPushRede();
      setDiagPayload(d);
      toastSucesso("Diagnóstico atualizado.");
    } catch (err) {
      toastErro(err?.message || "Falha ao obter diagnóstico.");
    } finally {
      setDiagCarregando(false);
    }
  }

  if (gestorRedeLogado() && subSecao === "indique") {
    return (
      <div className="gp-config">
        <Card>
          <GestorIndiqueGanheSubsecao onVoltar={() => setSubSecao(null)} />
        </Card>
      </div>
    );
  }

  if (gestorRedeLogado() && subSecao === "checkin") {
    return (
      <div className="gp-config">
        <Card>
          <GestorCheckinDiarioSubsecao onVoltar={() => setSubSecao(null)} />
        </Card>
      </div>
    );
  }
  if (gestorRedeLogado() && subSecao === "gire") {
    return (
      <div className="gp-config">
        <Card>
          <GestorGireGanheSubsecao onVoltar={() => setSubSecao(null)} />
        </Card>
      </div>
    );
  }

  if (gestorRedeLogado() && subSecao === "redesSociais") {
    return (
      <div className="gp-config">
        <Card>
          <GestorRedesSociaisSubsecao onVoltar={() => setSubSecao(null)} />
        </Card>
      </div>
    );
  }

  if (gestorRedeLogado() && subSecao === "niveis") {
    return (
      <div className="gp-config">
        <Card>
          <GestorNiveisClienteSubsecao onVoltar={() => setSubSecao(null)} />
        </Card>
      </div>
    );
  }

  const painelNotificacoes = (
    <div className="gp-config__notificacoes">
      <div className="gp-config__intro-bloco">
        <div className="gp-config__intro-icon" aria-hidden>
          <Bell size={20} />
        </div>
        <div>
          <h3 className="gp-config__titulo">Notificações no app (FCM)</h3>
          <p className="gp-config__ajuda">
            O envio usa os tokens dos <strong>clientes</strong> vinculados a esta rede. No celular, o app
            pode mostrar um diálogo (aberto) ou notificação na barra (em segundo plano); ao tocar, o
            mesmo resumo.
          </p>
        </div>
      </div>

      <div className="gp-config__diag-acoes">
        <Button
          type="button"
          variant="outline"
          icon={Stethoscope}
          disabled={diagCarregando}
          onClick={onDiagnosticoPush}
        >
          {diagCarregando ? "Consultando…" : "Diagnóstico push"}
        </Button>
      </div>

      {diagPayload ? (
        <pre className="gp-config__diag-json">{JSON.stringify(diagPayload, null, 2)}</pre>
      ) : null}

      <form className="gp-config__form-push" onSubmit={onEnviarTeste}>
        <div className="gp-config__form-push-cab">
          <Send size={16} aria-hidden />
          <strong>Enviar teste</strong>
        </div>
        <label className="gp-config__campo">
          Título
          <input
            className="gp-config__input"
            type="text"
            value={titulo}
            onChange={(ev) => setTitulo(ev.target.value)}
            placeholder="Ex.: Olá da rede"
            maxLength={120}
            autoComplete="off"
          />
        </label>
        <label className="gp-config__campo">
          Corpo (mensagem)
          <textarea
            className="gp-config__input gp-config__textarea"
            rows={4}
            value={corpo}
            onChange={(ev) => setCorpo(ev.target.value)}
            placeholder="Mensagem que o cliente lê no celular"
            maxLength={2000}
          />
        </label>
        <Button type="submit" icon={Send} disabled={enviando} className="gp-config__salvar">
          {enviando ? "Enviando…" : "Enviar teste a todos os apps da rede"}
        </Button>
      </form>
    </div>
  );

  const painelWhatsApp =
    gestorRedeLogado() ? (
      <div className="gp-config__notificacoes" style={{ marginTop: 28, paddingTop: 24, borderTop: "1px solid var(--borda, #e5e7eb)" }}>
        <div className="gp-config__intro-bloco">
          <div className="gp-config__intro-icon" aria-hidden>
            <MessageCircle size={20} />
          </div>
          <div>
            <h3 className="gp-config__titulo">Logs no WhatsApp (Evolution)</h3>
            <p className="gp-config__ajuda">
              Envia avisos operacionais (voucher, campanha) para um grupo da rede. A URL do Evolution fica
              só no servidor (<code>EVOLUTION_GO_BASE_URL</code>
              {waBaseSet ? " — configurada" : " — ainda não definida"}). Obtenha o JID do grupo com{" "}
              <code>GET /group/list</code> na instância conectada.
            </p>
          </div>
        </div>

        {waCarregando ? (
          <p className="gp-config__ajuda">Carregando…</p>
        ) : (
          <form className="gp-config__form-push" onSubmit={onSalvarWhatsApp}>
            <label className={`gp-config__toggle ${waHabilitado ? "gp-config__toggle--on" : ""}`}>
              <span className="gp-config__toggle-texto">
                <strong>Habilitado</strong>
                <small>Dispara mensagens quando houver eventos e a flag do tipo estiver ligada.</small>
              </span>
              <span className="gp-config__switch">
                <input
                  type="checkbox"
                  checked={waHabilitado}
                  onChange={(ev) => setWaHabilitado(ev.target.checked)}
                />
                <span className="gp-config__switch-track" aria-hidden />
              </span>
            </label>

            <label className="gp-config__campo">
              Nome da instância
              <input
                className="gp-config__input"
                type="text"
                value={waInstanceName}
                onChange={(ev) => setWaInstanceName(ev.target.value)}
                placeholder="Ex.: lucena-ops"
                autoComplete="off"
              />
            </label>
            <label className="gp-config__campo">
              Token (apikey Evolution)
              <input
                className="gp-config__input"
                type="password"
                value={waToken}
                onChange={(ev) => setWaToken(ev.target.value)}
                placeholder={waTokenMasked ? `Salvo: ${waTokenMasked} — deixe em branco para manter` : "Cole o apikey da instância"}
                autoComplete="off"
              />
            </label>
            <label className="gp-config__campo">
              Group JID
              <input
                className="gp-config__input"
                type="text"
                value={waGroupJid}
                onChange={(ev) => setWaGroupJid(ev.target.value)}
                placeholder="120363…@g.us"
                autoComplete="off"
              />
            </label>

            <div className="gp-config__form-push-cab" style={{ marginTop: 8 }}>
              <strong>Tipos de evento</strong>
            </div>
            <label className="gp-config__campo" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={waNotifyGerado} onChange={(ev) => setWaNotifyGerado(ev.target.checked)} />
              Voucher gerado
            </label>
            <label className="gp-config__campo" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={waNotifyPago} onChange={(ev) => setWaNotifyPago(ev.target.checked)} />
              Voucher pago (PIX)
            </label>
            <label className="gp-config__campo" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={waNotifyBaixa} onChange={(ev) => setWaNotifyBaixa(ev.target.checked)} />
              Baixa no posto
            </label>
            <label className="gp-config__campo" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <input type="checkbox" checked={waNotifyCampanha} onChange={(ev) => setWaNotifyCampanha(ev.target.checked)} />
              Campanha criada / ativada
            </label>

            <div className="gp-config__acoes-rodape" style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <Button type="submit" icon={Settings2} disabled={waSalvando}>
                {waSalvando ? "Salvando…" : "Salvar WhatsApp"}
              </Button>
              <Button type="button" variant="outline" icon={Send} disabled={waTestando} onClick={onTesteWhatsApp}>
                {waTestando ? "Enviando…" : "Enviar mensagem de teste"}
              </Button>
            </div>
          </form>
        )}
      </div>
    ) : null;

  if (!gestorRedeLogado()) {
    return (
      <div className="gp-config">
        <Card>{painelNotificacoes}</Card>
      </div>
    );
  }

  return (
    <div className="gp-config">
      <Card className="gp-config__shell">
        <div className="gp-config__shell-topo">
          <div>
            <p className="gp-config__kicker">App do cliente</p>
            <h3 className="gp-config__shell-titulo">Configuração da rede</h3>
            <p className="gp-config__ajuda">
              Módulos, níveis, ajustes por funcionalidade e teste de push.
            </p>
          </div>
          <div className="gp-config__shell-meta">
            <Badge variant={ativosCount > 0 ? "success" : "neutral"}>
              {ativosCount} módulo{ativosCount === 1 ? "" : "s"} ativo{ativosCount === 1 ? "" : "s"}
            </Badge>
          </div>
        </div>

        <div className="gp-config__tabs" role="tablist" aria-label="Áreas de configuração">
          {ABAS_CONFIG.map((aba) => {
            const Icon = aba.icon;
            const ativa = abaConfig === aba.id;
            return (
              <button
                key={aba.id}
                type="button"
                role="tab"
                id={`cfg-tab-${aba.id}`}
                aria-selected={ativa}
                aria-controls={`cfg-painel-${aba.id}`}
                className={`gp-config__tab ${ativa ? "gp-config__tab--ativa" : ""}`}
                onClick={() => setAbaConfig(aba.id)}
              >
                <Icon size={15} aria-hidden />
                {aba.label}
              </button>
            );
          })}
        </div>

        <div
          className="gp-config__painel"
          role="tabpanel"
          id={`cfg-painel-${abaConfig}`}
          aria-labelledby={`cfg-tab-${abaConfig}`}
        >
          {abaConfig === "funcionalidades" ? (
            <div className="gp-config__secao">
              <div className="gp-config__intro-bloco">
                <div className="gp-config__intro-icon" aria-hidden>
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="gp-config__titulo">Funcionalidades do app</h3>
                  <p className="gp-config__ajuda">
                    Por padrão tudo fica <strong>desligado</strong>. Ative o que a rede oferecerá; depois
                    configure as regras na aba Ajustes.
                  </p>
                </div>
              </div>

              {redeCarregada ? (
                <form onSubmit={onSalvarModulos}>
                  <div className="gp-config__toggles">
                    {MODULOS.map((m) => {
                      const st = estadosModulo[m.key];
                      return (
                        <ToggleModulo
                          key={m.key}
                          icon={m.icon}
                          titulo={m.titulo}
                          desc={m.desc}
                          checked={st.checked}
                          onChange={(ev) => st.set(ev.target.checked)}
                        />
                      );
                    })}
                  </div>
                  <div className="gp-config__acoes-rodape">
                    <Button type="submit" icon={Settings2} disabled={salvandoModulos}>
                      {salvandoModulos ? "Salvando…" : "Salvar módulos"}
                    </Button>
                  </div>
                </form>
              ) : (
                <p className="gp-config__ajuda">Carregando…</p>
              )}
            </div>
          ) : null}

          {abaConfig === "niveis" ? (
            <div className="gp-config__secao">
              <div className="gp-config__intro-bloco">
                <div className="gp-config__intro-icon" aria-hidden>
                  <Trophy size={20} />
                </div>
                <div>
                  <h3 className="gp-config__titulo">Níveis de cliente</h3>
                  <p className="gp-config__ajuda">
                    Bronze, Prata, Ouro e Diamante: multiplicadores opcionais no ganho de moedas e
                    descontos. Desligado por padrão.
                  </p>
                </div>
              </div>
              <AcaoCard
                icon={Trophy}
                titulo="Configurar níveis e multiplicadores"
                desc="Ative o sistema e defina os fatores de cada nível."
                onClick={() => setSubSecao("niveis")}
              />
            </div>
          ) : null}

          {abaConfig === "ajustes" ? (
            <div className="gp-config__secao">
              <div className="gp-config__intro-bloco">
                <div className="gp-config__intro-icon" aria-hidden>
                  <SlidersHorizontal size={20} />
                </div>
                <div>
                  <h3 className="gp-config__titulo">Ajustes dos módulos</h3>
                  <p className="gp-config__ajuda">
                    Abra a configuração de cada funcionalidade <strong>ligada</strong> na aba
                    Funcionalidades.
                  </p>
                </div>
              </div>

              {redeCarregada ? (
                <div className="gp-config__acoes-lista">
                  {modIndique ? (
                    <AcaoCard
                      icon={Gift}
                      titulo="Indique e ganhe"
                      desc="Regras e prêmios de indicação."
                      badge="Ativo"
                      onClick={() => setSubSecao("indique")}
                    />
                  ) : null}
                  {modCheckin ? (
                    <AcaoCard
                      icon={RotateCcw}
                      titulo="Check-in diário"
                      desc="Horário e moedas por check-in."
                      badge="Ativo"
                      onClick={() => setSubSecao("checkin")}
                    />
                  ) : null}
                  {modGire ? (
                    <AcaoCard
                      icon={Layers}
                      titulo="Gire e ganhe"
                      desc="Custo, prêmios e limite diário."
                      badge="Ativo"
                      onClick={() => setSubSecao("gire")}
                    />
                  ) : null}
                  {modRedesSociais ? (
                    <AcaoCard
                      icon={Link2}
                      titulo="Redes sociais"
                      desc="Títulos e links dos atalhos."
                      badge="Ativo"
                      onClick={() => setSubSecao("redesSociais")}
                    />
                  ) : null}
                  {!modIndique && !modCheckin && !modGire && !modRedesSociais ? (
                    <div className="gp-config__vazio">
                      <p>Nenhum módulo ativo.</p>
                      <Button type="button" variant="outline" onClick={() => setAbaConfig("funcionalidades")}>
                        Ir para Funcionalidades
                      </Button>
                    </div>
                  ) : null}
                </div>
              ) : (
                <p className="gp-config__ajuda">Carregando…</p>
              )}
            </div>
          ) : null}

          {abaConfig === "notificacoes" ? (
            <>
              {painelNotificacoes}
              {painelWhatsApp}
            </>
          ) : null}
        </div>
      </Card>
    </div>
  );
}
