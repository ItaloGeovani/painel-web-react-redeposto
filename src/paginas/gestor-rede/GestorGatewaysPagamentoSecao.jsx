import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Banknote,
  Building2,
  CheckCircle2,
  Copy,
  CreditCard,
  Eye,
  EyeOff,
  Home,
  QrCode,
  Save,
  Store,
  Wallet
} from "lucide-react";
import {
  obterConfigMercadoPago,
  salvarConfigMercadoPago,
  salvarConfigMercadoPagoPosto,
  salvarGatewayPagamentoModo
} from "../../servicos/mercadopagoGatewayServico";
import {
  obterConfigERede,
  salvarConfigERede,
  salvarConfigERedePosto,
  salvarGatewayProvedor,
  salvarMeiosPosto
} from "../../servicos/eredeGatewayServico";
import { gerentePostoLogado, gestorRedeLogado } from "../../configuracao/painelApi";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import Badge from "../../componentes/ui/Badge";
import Button from "../../componentes/ui/Button";
import Card from "../../componentes/ui/Card";

const PROVEDORES = [
  { id: "MERCADO_PAGO", rotulo: "Mercado Pago" },
  { id: "E_REDE", rotulo: "e.Rede (Itaú)" }
];

const MODOS = [
  {
    id: "REDE",
    titulo: "Uma conta para toda a rede",
    desc: "Todos os postos recebem PIX na mesma conta do provedor ativo."
  },
  {
    id: "POSTO",
    titulo: "Conta por posto",
    desc: "Cada unidade tem credenciais próprias; o cliente escolhe o posto na compra do voucher."
  }
];

function meiosPadrao() {
  return { pix: true, cartao_credito: false, cartao_debito: false, dinheiro: false, moeda_virtual: false };
}

function rotuloProvedor(id) {
  return id === "E_REDE" ? "e.Rede" : "Mercado Pago";
}

function temAlgumMeio(m) {
  return !!(m?.pix || m?.cartao_credito || m?.cartao_debito || m?.dinheiro || m?.moeda_virtual);
}

function nomeMoedaRede(rede) {
  const n = (rede?.moeda_virtual_nome || "").trim();
  return n || "Moeda virtual";
}

async function copiarTexto(texto) {
  if (!texto) return;
  try {
    await navigator.clipboard.writeText(texto);
    toastSucesso("URL copiada.");
  } catch {
    toastErro("Não foi possível copiar.");
  }
}

function CampoSegredoComOlho({ value, onChange, autoComplete = "off", placeholder = "" }) {
  const [visivel, setVisivel] = useState(false);
  return (
    <div className="gp-gateways__segredo">
      <input
        className="gp-gateways__input"
        type={visivel ? "text" : "password"}
        autoComplete={autoComplete}
        value={value}
        placeholder={placeholder}
        onChange={onChange}
      />
      <button
        type="button"
        className="gp-gateways__icone-btn"
        aria-label={visivel ? "Ocultar" : "Mostrar"}
        title={visivel ? "Ocultar" : "Mostrar"}
        onClick={() => setVisivel((v) => !v)}
      >
        {visivel ? <EyeOff size={18} /> : <Eye size={18} />}
      </button>
    </div>
  );
}

function CampoWebhook({ value }) {
  return (
    <div className="gp-gateways__segredo">
      <input
        className="gp-gateways__input gp-gateways__input--readonly"
        readOnly
        value={value || ""}
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        className="gp-gateways__icone-btn"
        aria-label="Copiar webhook"
        title="Copiar"
        onClick={() => copiarTexto(value)}
      >
        <Copy size={16} />
      </button>
    </div>
  );
}

function OpcaoRadioCard({ name, value, checked, disabled, titulo, desc, onChange }) {
  return (
    <label className={`gp-gateways__radio-card ${checked ? "gp-gateways__radio-card--ativo" : ""}`}>
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        disabled={disabled}
        onChange={onChange}
      />
      <span className="gp-gateways__radio-dot" aria-hidden />
      <span className="gp-gateways__radio-texto">
        <strong>{titulo}</strong>
        {desc ? <small>{desc}</small> : null}
      </span>
    </label>
  );
}

function StatusMini({ icon: Icon, label, value, tone = "blue" }) {
  return (
    <div className={`gp-gateways__status gp-gateways__status--${tone}`}>
      <div className="gp-gateways__status-icon" aria-hidden>
        <Icon size={16} />
      </div>
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
      </div>
    </div>
  );
}

export default function GestorGatewaysPagamentoSecao({ rede = null }) {
  const [subAtivo, setSubAtivo] = useState("mercadopago");
  const [carregando, setCarregando] = useState(true);
  const [salvandoModo, setSalvandoModo] = useState(false);
  const [salvandoProvedor, setSalvandoProvedor] = useState(false);
  const [modo, setModo] = useState("REDE");
  const [provedor, setProvedor] = useState("MERCADO_PAGO");
  const [meios, setMeios] = useState(meiosPadrao());
  const [configMP, setConfigMP] = useState(null);
  const [configER, setConfigER] = useState(null);
  const [postoEditando, setPostoEditando] = useState(null);

  const ehGestor = gestorRedeLogado();
  const ehGerente = gerentePostoLogado();
  const provedorAtivo = provedor === "E_REDE" ? "E_REDE" : "MERCADO_PAGO";

  const recarregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [mp, er] = await Promise.all([obterConfigMercadoPago(), obterConfigERede()]);
      setConfigMP(mp);
      setConfigER(er);
      setModo(mp.gateway_pagamento_modo === "POSTO" ? "POSTO" : "REDE");
      const p = er.gateway_provedor_ativo || mp.gateway_provedor_ativo || "MERCADO_PAGO";
      setProvedor(p === "E_REDE" ? "E_REDE" : "MERCADO_PAGO");
      const m = er.gateway_meios_habilitados || mp.gateway_meios_habilitados || meiosPadrao();
      setMeios({
        pix: m.pix !== false,
        cartao_credito: !!m.cartao_credito,
        cartao_debito: !!m.cartao_debito,
        dinheiro: !!m.dinheiro,
        moeda_virtual: !!m.moeda_virtual
      });
    } catch (err) {
      toastErro(err.message || "Falha ao carregar configuração.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    recarregar();
  }, [recarregar]);

  useEffect(() => {
    if (provedorAtivo === "E_REDE" && subAtivo === "mercadopago") {
      setSubAtivo("erede");
    }
    if (provedorAtivo === "MERCADO_PAGO" && subAtivo === "erede") {
      setSubAtivo("mercadopago");
    }
  }, [provedorAtivo, subAtivo]);

  async function alterarModo(novoModo) {
    if (!ehGestor || novoModo === modo) return;
    setSalvandoModo(true);
    try {
      await salvarGatewayPagamentoModo(novoModo);
      setModo(novoModo);
      toastSucesso(
        novoModo === "POSTO" ? "Modo por posto ativado." : "Modo conta única da rede ativado."
      );
      await recarregar();
    } catch (err) {
      toastErro(err.message || "Falha ao alterar modo.");
    } finally {
      setSalvandoModo(false);
    }
  }

  async function salvarProvedorEMeios(novoProvedor, novoMeios) {
    if (!ehGestor) return;
    setSalvandoProvedor(true);
    try {
      const body = {
        gateway_provedor_ativo: novoProvedor,
        gateway_meios_habilitados: novoMeios
      };
      if (novoProvedor === "E_REDE") {
        body.gateway_meios_habilitados = {
          pix: novoMeios.pix,
          cartao_credito: false,
          cartao_debito: false,
          dinheiro: !!novoMeios.dinheiro,
          moeda_virtual: !!novoMeios.moeda_virtual
        };
      }
      await salvarGatewayProvedor(body);
      setProvedor(novoProvedor);
      const m = body.gateway_meios_habilitados || {};
      setMeios({
        pix: m.pix !== false,
        cartao_credito: !!m.cartao_credito,
        cartao_debito: !!m.cartao_debito,
        dinheiro: !!m.dinheiro,
        moeda_virtual: !!m.moeda_virtual
      });
      toastSucesso("Provedor e meios atualizados.");
      await recarregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar provedor.");
    } finally {
      setSalvandoProvedor(false);
    }
  }

  const configAtivo = provedorAtivo === "E_REDE" ? configER : configMP;
  const mensagemGerente = configAtivo?.mensagem;

  const postoGerente =
    ehGerente && configAtivo?.id_posto
      ? {
          id_posto: configAtivo.id_posto,
          nome: "Seu posto",
          webhook_url: configAtivo.webhook_url,
          gateway_meios_habilitados:
            configAtivo.gateway_meios_posto || meiosPadrao(),
          ...(provedorAtivo === "E_REDE"
            ? {
                pv_configurado: configAtivo.pv_configurado,
                client_secret_configurado: configAtivo.client_secret_configurado,
                pv: configAtivo.pv || "",
                client_secret: configAtivo.client_secret || "",
                ambiente: configAtivo.ambiente || "sandbox"
              }
            : {
                mp_access_token_configurado: configAtivo.mp_access_token_configurado,
                mp_webhook_secret_configurado: configAtivo.mp_webhook_secret_configurado
              })
        }
      : null;

  const resumoPostos = useMemo(() => {
    const postos = configAtivo?.postos || [];
    if (!postos.length && postoGerente) {
      const ok =
        provedorAtivo === "E_REDE"
          ? postoGerente.pv_configurado && postoGerente.client_secret_configurado
          : postoGerente.mp_access_token_configurado && postoGerente.mp_webhook_secret_configurado;
      return { total: 1, ok: ok ? 1 : 0 };
    }
    let ok = 0;
    for (const p of postos) {
      const configurado =
        provedorAtivo === "E_REDE"
          ? p.pv_configurado && p.client_secret_configurado
          : p.mp_access_token_configurado && p.mp_webhook_secret_configurado;
      if (configurado) ok += 1;
    }
    return { total: postos.length, ok };
  }, [configAtivo, postoGerente, provedorAtivo]);

  if (ehGerente && mensagemGerente) {
    return (
      <div className="gp-gateways">
        <Card>
          <h3 className="gp-gateways__painel-titulo">Gateways de pagamento</h3>
          <p className="gp-gateways__ajuda">{mensagemGerente}</p>
        </Card>
      </div>
    );
  }

  const breadcrumbRede = rede
    ? `${rede.nome_fantasia || "Rede"} — CNPJ ${rede.cnpj || "—"}`
    : null;

  return (
    <div className="gp-gateways">
      <header className="gp-gateways__hero">
        <div>
          <p className="gp-gateways__kicker">Pagamentos</p>
          <h2 className="gp-gateways__hero-titulo">
            {ehGerente ? "Gateways do seu posto" : "Gateways de pagamento"}
          </h2>
          <p className="gp-gateways__ajuda gp-gateways__ajuda--hero">
            {ehGerente
              ? "Defina se o posto aceita PIX e/ou dinheiro, e mantenha as credenciais do provedor atualizadas."
              : "Escolha o provedor da rede, os meios liberados e as credenciais (conta única ou por posto)."}
          </p>
        </div>
        {breadcrumbRede ? (
          <nav className="gp-gateways__breadcrumb" aria-label="Contexto da rede">
            <Home size={14} aria-hidden />
            <span>{breadcrumbRede}</span>
          </nav>
        ) : null}
      </header>

      {ehGestor ? (
        <div className="gp-gateways__topo">
          <Card className="gp-gateways__card-bloco">
            <h3 className="gp-gateways__bloco-titulo">Provedor ativo</h3>
            <p className="gp-gateways__ajuda">
              Apenas um provedor por rede. Vouchers PIX usam o provedor selecionado.
            </p>
            <div className="gp-gateways__radio-grid">
              {PROVEDORES.map((p) => (
                <OpcaoRadioCard
                  key={p.id}
                  name="gateway_provedor"
                  value={p.id}
                  checked={provedor === p.id}
                  disabled={salvandoProvedor}
                  titulo={p.rotulo}
                  onChange={() => salvarProvedorEMeios(p.id, meios)}
                />
              ))}
            </div>
          </Card>

          <Card className="gp-gateways__card-bloco">
            <h3 className="gp-gateways__bloco-titulo">Meios liberados na rede</h3>
            <p className="gp-gateways__ajuda">
              Limite geral. Cada posto escolhe, entre estes, o que aceita na prática.
            </p>
            <div className="gp-gateways__meio-tiles">
              <MeioTile
                ativo={meios.pix}
                disabled={salvandoProvedor}
                icon={QrCode}
                titulo="PIX"
                desc="Pagamento no app"
                onToggle={(v) => {
                  const novo = { ...meios, pix: v };
                  if (!temAlgumMeio(novo)) {
                    toastErro("Selecione ao menos um meio.");
                    return;
                  }
                  salvarProvedorEMeios(provedor, novo);
                }}
              />
              <MeioTile
                ativo={!!meios.dinheiro}
                disabled={salvandoProvedor}
                icon={Banknote}
                titulo="Dinheiro"
                desc="Paga no posto"
                onToggle={(v) => {
                  const novo = { ...meios, dinheiro: v };
                  if (!temAlgumMeio(novo)) {
                    toastErro("Selecione ao menos um meio.");
                    return;
                  }
                  salvarProvedorEMeios(provedor, novo);
                }}
              />
              <MeioTile
                ativo={!!meios.moeda_virtual}
                disabled={salvandoProvedor}
                icon={Wallet}
                titulo={nomeMoedaRede(rede)}
                desc="Cliente paga com saldo do app"
                onToggle={(v) => {
                  const novo = { ...meios, moeda_virtual: v };
                  if (!temAlgumMeio(novo)) {
                    toastErro("Selecione ao menos um meio.");
                    return;
                  }
                  salvarProvedorEMeios(provedor, novo);
                }}
              />
              <MeioTile
                ativo={meios.cartao_credito}
                disabled={salvandoProvedor || provedorAtivo === "E_REDE"}
                bloqueado={provedorAtivo === "E_REDE"}
                icon={CreditCard}
                titulo="Crédito"
                desc={provedorAtivo === "E_REDE" ? "Em breve" : "Cartão crédito"}
                onToggle={(v) => salvarProvedorEMeios(provedor, { ...meios, cartao_credito: v })}
              />
              <MeioTile
                ativo={meios.cartao_debito}
                disabled={salvandoProvedor || provedorAtivo === "E_REDE"}
                bloqueado={provedorAtivo === "E_REDE"}
                icon={CreditCard}
                titulo="Débito"
                desc={provedorAtivo === "E_REDE" ? "Em breve" : "Cartão débito"}
                onToggle={(v) => salvarProvedorEMeios(provedor, { ...meios, cartao_debito: v })}
              />
            </div>
          </Card>

          <div className="gp-gateways__status-col">
            <StatusMini
              icon={Wallet}
              label="Provedor"
              value={rotuloProvedor(provedorAtivo)}
              tone="blue"
            />
            <StatusMini
              icon={Building2}
              label="Modelo"
              value={modo === "POSTO" ? "Conta por posto" : "Conta da rede"}
              tone="slate"
            />
            <StatusMini
              icon={CheckCircle2}
              label="Postos"
              value={
                resumoPostos.total
                  ? `${resumoPostos.ok} de ${resumoPostos.total}`
                  : modo === "REDE"
                    ? "Conta única"
                    : "—"
              }
              tone={resumoPostos.total && resumoPostos.ok === resumoPostos.total ? "green" : "amber"}
            />
          </div>
        </div>
      ) : null}

      {ehGestor ? (
        <div className="gp-gateways__tabs" role="tablist" aria-label="Gateway ativo">
          <button
            type="button"
            role="tab"
            aria-selected
            className="gp-gateways__tab gp-gateways__tab--ativo"
          >
            {provedorAtivo === "E_REDE" ? "e.Rede" : "Mercado Pago"}
          </button>
        </div>
      ) : null}

      {provedorAtivo === "MERCADO_PAGO" ? (
        <PainelMercadoPago
          ehGestor={ehGestor}
          modo={modo}
          carregando={carregando}
          config={configMP}
          postoGerente={postoGerente}
          postoEditando={postoEditando}
          setPostoEditando={setPostoEditando}
          salvandoModo={salvandoModo}
          onAlterarModo={alterarModo}
          onRecarregar={recarregar}
          nomeMoeda={nomeMoedaRede(rede)}
        />
      ) : (
        <PainelERede
          ehGestor={ehGestor}
          modo={modo}
          carregando={carregando}
          config={configER}
          postoGerente={postoGerente}
          postoEditando={postoEditando}
          setPostoEditando={setPostoEditando}
          salvandoModo={salvandoModo}
          onAlterarModo={alterarModo}
          onRecarregar={recarregar}
          nomeMoeda={nomeMoedaRede(rede)}
        />
      )}
    </div>
  );
}

function MeioTile({ ativo, disabled, bloqueado, icon: Icon, titulo, desc, onToggle }) {
  return (
    <button
      type="button"
      className={`gp-gateways__meio-tile ${ativo ? "gp-gateways__meio-tile--on" : ""} ${
        bloqueado ? "gp-gateways__meio-tile--bloqueado" : ""
      }`}
      disabled={disabled || bloqueado}
      aria-pressed={ativo}
      onClick={() => onToggle(!ativo)}
    >
      <span className="gp-gateways__meio-tile-icon" aria-hidden>
        <Icon size={18} />
      </span>
      <span className="gp-gateways__meio-tile-texto">
        <strong>{titulo}</strong>
        <small>{desc}</small>
      </span>
      <span className={`gp-gateways__switch ${ativo ? "gp-gateways__switch--on" : ""}`} aria-hidden>
        <span className="gp-gateways__switch-knob" />
      </span>
    </button>
  );
}

function ModeloRecebimento({ modo, salvandoModo, onAlterarModo, name }) {
  return (
    <section className="gp-gateways__secao">
      <h4 className="gp-gateways__secao-titulo">Modelo de recebimento</h4>
      <div className="gp-gateways__radio-grid gp-gateways__radio-grid--2">
        {MODOS.map((m) => (
          <OpcaoRadioCard
            key={m.id}
            name={name}
            value={m.id}
            checked={modo === m.id}
            disabled={salvandoModo}
            titulo={m.titulo}
            desc={m.desc}
            onChange={() => onAlterarModo(m.id)}
          />
        ))}
      </div>
    </section>
  );
}

function PainelMercadoPago({
  ehGestor,
  modo,
  carregando,
  config,
  postoGerente,
  postoEditando,
  setPostoEditando,
  salvandoModo,
  onAlterarModo,
  onRecarregar,
  nomeMoeda = "Moeda virtual"
}) {
  const [salvando, setSalvando] = useState(false);

  return (
    <Card className="gp-gateways__painel">
      <div className="gp-gateways__painel-cabecalho">
        <CreditCard size={22} aria-hidden />
        <div>
          <h3 className="gp-gateways__painel-titulo">Mercado Pago</h3>
          <p className="gp-gateways__ajuda">
            Cadastre a URL do webhook em <strong>Suas integrações → Webhooks</strong> no Mercado Pago.
          </p>
        </div>
      </div>

      {ehGestor ? (
        <ModeloRecebimento
          modo={modo}
          salvandoModo={salvandoModo}
          onAlterarModo={onAlterarModo}
          name="gateway_modo_mp"
        />
      ) : null}

      {carregando ? (
        <p className="gp-gateways__ajuda">Carregando...</p>
      ) : modo === "REDE" && ehGestor ? (
        <FormCredenciaisRedeMP
          config={config}
          salvando={salvando}
          setSalvando={setSalvando}
          onSalvo={onRecarregar}
        />
      ) : postoGerente ? (
        <PostoMercadoPagoForm
          posto={postoGerente}
          meiosRede={config?.gateway_meios_habilitados}
          onMeiosSalvo={onRecarregar}
          onCredenciaisSalvo={onRecarregar}
          nomeMoeda={nomeMoeda}
        />
      ) : (
        <ListaPostosMP
          config={config}
          postoEditando={postoEditando}
          setPostoEditando={setPostoEditando}
          onRecarregar={onRecarregar}
          nomeMoeda={nomeMoeda}
        />
      )}
    </Card>
  );
}

function PainelERede({
  ehGestor,
  modo,
  carregando,
  config,
  postoGerente,
  postoEditando,
  setPostoEditando,
  salvandoModo,
  onAlterarModo,
  onRecarregar,
  nomeMoeda = "Moeda virtual"
}) {
  return (
    <Card className="gp-gateways__painel">
      <div className="gp-gateways__painel-cabecalho">
        <Wallet size={22} aria-hidden />
        <div>
          <h3 className="gp-gateways__painel-titulo">
            {ehGestor ? "e.Rede (Itaú)" : "Configuração do posto · e.Rede"}
          </h3>
          <p className="gp-gateways__ajuda">
            {ehGestor
              ? "Use PV e Token do portal developer.userede.com.br. No sandbox o PIX é simulado; em produção cadastre IPs e webhook."
              : "Primeiro escolha PIX e/ou dinheiro. Depois confirme PV, token e ambiente."}
          </p>
        </div>
      </div>

      {ehGestor ? (
        <ModeloRecebimento
          modo={modo}
          salvandoModo={salvandoModo}
          onAlterarModo={onAlterarModo}
          name="gateway_modo_er"
        />
      ) : null}

      {carregando ? (
        <p className="gp-gateways__ajuda">Carregando...</p>
      ) : modo === "REDE" && ehGestor ? (
        <FormCredenciaisRedeERede config={config} onSalvo={onRecarregar} />
      ) : postoGerente ? (
        <PostoERedeForm
          posto={postoGerente}
          meiosRede={config?.gateway_meios_habilitados}
          onMeiosSalvo={onRecarregar}
          onCredenciaisSalvo={onRecarregar}
          nomeMoeda={nomeMoeda}
        />
      ) : (
        <ListaPostosERede
          config={config}
          postoEditando={postoEditando}
          setPostoEditando={setPostoEditando}
          onRecarregar={onRecarregar}
          nomeMoeda={nomeMoeda}
        />
      )}
    </Card>
  );
}

function PostoLinha({ nome, codigo, configurado, aberto, onToggle, children }) {
  return (
    <li className={`gp-gateways__posto ${aberto ? "gp-gateways__posto--aberto" : ""}`}>
      <div className="gp-gateways__posto-cabecalho">
        <div className="gp-gateways__posto-info">
          <span className="gp-gateways__posto-icon" aria-hidden>
            <Store size={18} />
          </span>
          <div>
            <strong>{nome}</strong>
            {codigo ? <span className="gp-gateways__posto-codigo">{codigo}</span> : null}
          </div>
          <Badge variant={configurado ? "success" : "warning"}>
            {configurado ? "Configurado" : "Pendente"}
          </Badge>
        </div>
        <Button variant="outline" size="sm" onClick={onToggle}>
          {aberto ? "Fechar" : "Configurar"}
        </Button>
      </div>
      {aberto ? <div className="gp-gateways__posto-corpo">{children}</div> : null}
    </li>
  );
}

function ListaPostosMP({ config, postoEditando, setPostoEditando, onRecarregar, nomeMoeda = "Moeda virtual" }) {
  return (
    <section className="gp-gateways__secao">
      <p className="gp-gateways__ajuda">Configure credenciais e webhook para cada posto.</p>
      <ul className="gp-gateways__postos">
        {(config?.postos || []).map((p) => {
          const ok = p.mp_access_token_configurado && p.mp_webhook_secret_configurado;
          const aberto = postoEditando === p.id_posto;
          return (
            <PostoLinha
              key={p.id_posto}
              nome={p.nome}
              codigo={p.codigo}
              configurado={ok}
              aberto={aberto}
              onToggle={() => setPostoEditando(aberto ? null : p.id_posto)}
            >
              <PostoMercadoPagoForm
                posto={p}
                meiosRede={config?.gateway_meios_habilitados}
                onMeiosSalvo={onRecarregar}
                nomeMoeda={nomeMoeda}
                onCredenciaisSalvo={async () => {
                  setPostoEditando(null);
                  await onRecarregar();
                }}
              />
            </PostoLinha>
          );
        })}
      </ul>
    </section>
  );
}

function ListaPostosERede({ config, postoEditando, setPostoEditando, onRecarregar, nomeMoeda = "Moeda virtual" }) {
  return (
    <section className="gp-gateways__secao">
      <p className="gp-gateways__ajuda">PV e secret por posto (modo POSTO).</p>
      <ul className="gp-gateways__postos">
        {(config?.postos || []).map((p) => {
          const ok = p.pv_configurado && p.client_secret_configurado;
          const aberto = postoEditando === p.id_posto;
          return (
            <PostoLinha
              key={p.id_posto}
              nome={p.nome}
              codigo={p.codigo}
              configurado={ok}
              aberto={aberto}
              onToggle={() => setPostoEditando(aberto ? null : p.id_posto)}
            >
              <PostoERedeForm
                posto={p}
                meiosRede={config?.gateway_meios_habilitados}
                onMeiosSalvo={onRecarregar}
                nomeMoeda={nomeMoeda}
                onCredenciaisSalvo={async () => {
                  setPostoEditando(null);
                  await onRecarregar();
                }}
              />
            </PostoLinha>
          );
        })}
      </ul>
    </section>
  );
}

function FormCredenciaisRedeMP({ config, salvando, setSalvando, onSalvo }) {
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    const at = accessToken.trim();
    const ws = webhookSecret.trim();
    if (!at || !ws) {
      toastErro("Preencha o Access Token e o secret do webhook.");
      return;
    }
    setSalvando(true);
    try {
      await salvarConfigMercadoPago({ mp_access_token: at, mp_webhook_secret: ws });
      toastSucesso("Credenciais da rede salvas.");
      setAccessToken("");
      setWebhookSecret("");
      await onSalvo();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="gp-gateways__form" onSubmit={onSubmit}>
      <p className="gp-gateways__ajuda">Conta única: todos os vouchers PIX usam estas credenciais.</p>
      <label className="gp-gateways__campo">
        URL do webhook
        <CampoWebhook value={config?.webhook_url || ""} />
      </label>
      <label className="gp-gateways__campo">
        Access Token
        <CampoSegredoComOlho value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
      </label>
      <label className="gp-gateways__campo">
        Webhook secret
        <CampoSegredoComOlho value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
      </label>
      <Button type="submit" icon={Save} disabled={salvando} className="gp-gateways__salvar">
        {salvando ? "Salvando..." : "Salvar Mercado Pago"}
      </Button>
    </form>
  );
}

function FormCredenciaisRedeERede({ config, onSalvo }) {
  const [pv, setPv] = useState(config?.pv || "");
  const [secret, setSecret] = useState(config?.client_secret || "");
  const [ambiente, setAmbiente] = useState(config?.ambiente || "sandbox");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setPv(config?.pv || "");
    setSecret(config?.client_secret || "");
    setAmbiente(config?.ambiente || "sandbox");
  }, [config?.pv, config?.client_secret, config?.ambiente]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!pv.trim() || !secret.trim()) {
      toastErro("Preencha PV e Token (client secret).");
      return;
    }
    setSalvando(true);
    try {
      await salvarConfigERede({ pv: pv.trim(), client_secret: secret.trim(), ambiente });
      toastSucesso("e.Rede salvo para a rede.");
      await onSalvo();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <form className="gp-gateways__form" onSubmit={onSubmit}>
      <label className="gp-gateways__campo">
        URL do webhook
        <CampoWebhook value={config?.webhook_url || ""} />
      </label>
      <label className="gp-gateways__campo gp-gateways__campo--curto">
        Ambiente
        <select
          className="gp-gateways__input"
          value={ambiente}
          onChange={(e) => setAmbiente(e.target.value)}
        >
          <option value="sandbox">Sandbox</option>
          <option value="producao">Produção</option>
        </select>
      </label>
      <label className="gp-gateways__campo">
        PV (clientId)
        <CampoSegredoComOlho value={pv} onChange={(e) => setPv(e.target.value)} />
      </label>
      <label className="gp-gateways__campo">
        Token / client secret
        <CampoSegredoComOlho value={secret} onChange={(e) => setSecret(e.target.value)} />
      </label>
      <Button type="submit" icon={Save} disabled={salvando} className="gp-gateways__salvar">
        {salvando ? "Salvando..." : "Salvar e.Rede"}
      </Button>
    </form>
  );
}

function MeiosPostoBloco({ posto, meiosRede, onSalvo, nomeMoeda = "Moeda virtual" }) {
  const rede = meiosRede || meiosPadrao();
  const inicial = posto?.gateway_meios_habilitados || meiosPadrao();
  const [pix, setPix] = useState(!!inicial.pix);
  const [dinheiro, setDinheiro] = useState(!!inicial.dinheiro);
  const [moedaVirtual, setMoedaVirtual] = useState(!!inicial.moeda_virtual);
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    const m = posto?.gateway_meios_habilitados || meiosPadrao();
    setPix(!!m.pix);
    setDinheiro(!!m.dinheiro);
    setMoedaVirtual(!!m.moeda_virtual);
  }, [
    posto?.id_posto,
    posto?.gateway_meios_habilitados?.pix,
    posto?.gateway_meios_habilitados?.dinheiro,
    posto?.gateway_meios_habilitados?.moeda_virtual
  ]);

  const pixEfetivo = pix && !!rede.pix;
  const dinheiroEfetivo = dinheiro && !!rede.dinheiro;
  const moedaEfetivo = moedaVirtual && !!rede.moeda_virtual;
  const sujo =
    pixEfetivo !== !!inicial.pix ||
    dinheiroEfetivo !== !!inicial.dinheiro ||
    moedaEfetivo !== !!inicial.moeda_virtual;

  async function salvar() {
    if (!pixEfetivo && !dinheiroEfetivo && !moedaEfetivo) {
      toastErro("Selecione ao menos um meio neste posto.");
      return;
    }
    setSalvando(true);
    try {
      await salvarMeiosPosto({
        id_posto: posto.id_posto,
        gateway_meios_habilitados: {
          pix: pixEfetivo,
          dinheiro: dinheiroEfetivo,
          moeda_virtual: moedaEfetivo,
          cartao_credito: false,
          cartao_debito: false
        }
      });
      toastSucesso(`Meios atualizados para ${posto.nome || "posto"}.`);
      await onSalvo?.();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar meios.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <section className="gp-gateways__painel-bloco">
      <div className="gp-gateways__painel-bloco-cab">
        <div>
          <h4 className="gp-gateways__subbloco-titulo">1. Meios neste posto</h4>
          <p className="gp-gateways__ajuda">
            Toque para ligar ou desligar. Só opções liberadas na rede aparecem ativas.
          </p>
        </div>
        <div className="gp-gateways__chips">
          {pixEfetivo ? <span className="gp-gateways__chip gp-gateways__chip--pix">PIX</span> : null}
          {dinheiroEfetivo ? (
            <span className="gp-gateways__chip gp-gateways__chip--dinheiro">Dinheiro</span>
          ) : null}
          {moedaEfetivo ? (
            <span className="gp-gateways__chip gp-gateways__chip--pix">{nomeMoeda}</span>
          ) : null}
          {!pixEfetivo && !dinheiroEfetivo && !moedaEfetivo ? (
            <span className="gp-gateways__chip gp-gateways__chip--warn">Nenhum meio</span>
          ) : null}
        </div>
      </div>
      <div className="gp-gateways__meio-tiles">
        <MeioTile
          ativo={pixEfetivo}
          disabled={!rede.pix || salvando}
          bloqueado={!rede.pix}
          icon={QrCode}
          titulo="PIX"
          desc={rede.pix ? "Paga no app com QR" : "Indisponível na rede"}
          onToggle={setPix}
        />
        <MeioTile
          ativo={dinheiroEfetivo}
          disabled={!rede.dinheiro || salvando}
          bloqueado={!rede.dinheiro}
          icon={Banknote}
          titulo="Dinheiro"
          desc={rede.dinheiro ? "Cliente paga o frentista" : "Indisponível na rede"}
          onToggle={setDinheiro}
        />
        <MeioTile
          ativo={moedaEfetivo}
          disabled={!rede.moeda_virtual || salvando}
          bloqueado={!rede.moeda_virtual}
          icon={Wallet}
          titulo={nomeMoeda}
          desc={
            rede.moeda_virtual
              ? "Saldo do app"
              : "Peça ao gestor: liberar em Meios da rede"
          }
          onToggle={setMoedaVirtual}
        />
      </div>
      <div className="gp-gateways__acoes-linha">
        {sujo ? <span className="gp-gateways__sujo">Alterações não salvas</span> : <span />}
        <Button
          type="button"
          icon={Save}
          disabled={salvando || !sujo}
          onClick={salvar}
          className="gp-gateways__salvar gp-gateways__salvar--auto"
        >
          {salvando ? "Salvando..." : "Salvar meios"}
        </Button>
      </div>
    </section>
  );
}

function PostoMercadoPagoForm({ posto, meiosRede, onMeiosSalvo, onCredenciaisSalvo, nomeMoeda = "Moeda virtual" }) {
  const [accessToken, setAccessToken] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [salvando, setSalvando] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    const at = accessToken.trim();
    const ws = webhookSecret.trim();
    if (!at || !ws) {
      toastErro("Preencha token e secret.");
      return;
    }
    setSalvando(true);
    try {
      await salvarConfigMercadoPagoPosto({
        id_posto: posto.id_posto,
        mp_access_token: at,
        mp_webhook_secret: ws
      });
      toastSucesso(`Mercado Pago salvo para ${posto.nome}.`);
      setAccessToken("");
      setWebhookSecret("");
      await onCredenciaisSalvo();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="gp-gateways__form">
      <MeiosPostoBloco posto={posto} meiosRede={meiosRede} onSalvo={onMeiosSalvo} nomeMoeda={nomeMoeda} />
      <section className="gp-gateways__painel-bloco">
        <h4 className="gp-gateways__subbloco-titulo">2. Credenciais Mercado Pago</h4>
        <p className="gp-gateways__ajuda">Webhook e tokens desta unidade.</p>
        <form className="gp-gateways__form-interna" onSubmit={onSubmit}>
          <label className="gp-gateways__campo">
            Webhook
            <CampoWebhook value={posto.webhook_url || ""} />
          </label>
          <label className="gp-gateways__campo">
            Access Token
            <CampoSegredoComOlho value={accessToken} onChange={(e) => setAccessToken(e.target.value)} />
          </label>
          <label className="gp-gateways__campo">
            Webhook secret
            <CampoSegredoComOlho value={webhookSecret} onChange={(e) => setWebhookSecret(e.target.value)} />
          </label>
          <Button type="submit" icon={Save} disabled={salvando} className="gp-gateways__salvar">
            {salvando ? "Salvando..." : "Salvar credenciais"}
          </Button>
        </form>
      </section>
    </div>
  );
}

function PostoERedeForm({ posto, meiosRede, onMeiosSalvo, onCredenciaisSalvo, nomeMoeda = "Moeda virtual" }) {
  const [pv, setPv] = useState(posto?.pv || "");
  const [secret, setSecret] = useState(posto?.client_secret || "");
  const [ambiente, setAmbiente] = useState(posto?.ambiente || "sandbox");
  const [salvando, setSalvando] = useState(false);

  useEffect(() => {
    setPv(posto?.pv || "");
    setSecret(posto?.client_secret || "");
    setAmbiente(posto?.ambiente || "sandbox");
  }, [posto?.id_posto, posto?.pv, posto?.client_secret, posto?.ambiente]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!pv.trim() || !secret.trim()) {
      toastErro("Preencha PV e secret.");
      return;
    }
    setSalvando(true);
    try {
      await salvarConfigERedePosto({
        id_posto: posto.id_posto,
        pv: pv.trim(),
        client_secret: secret.trim(),
        ambiente
      });
      toastSucesso(`e.Rede salvo para ${posto.nome || "posto"}.`);
      await onCredenciaisSalvo();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  return (
    <div className="gp-gateways__form">
      <MeiosPostoBloco posto={posto} meiosRede={meiosRede} onSalvo={onMeiosSalvo} nomeMoeda={nomeMoeda} />
      <section className="gp-gateways__painel-bloco">
        <h4 className="gp-gateways__subbloco-titulo">2. Credenciais e.Rede</h4>
        <p className="gp-gateways__ajuda">PV, token e ambiente desta unidade.</p>
        <form className="gp-gateways__form-interna" onSubmit={onSubmit}>
          <label className="gp-gateways__campo">
            Webhook
            <CampoWebhook value={posto.webhook_url || ""} />
          </label>
          <div className="gp-gateways__campo">
            Ambiente
            <div className="gp-gateways__segmented" role="group" aria-label="Ambiente">
              <button
                type="button"
                className={`gp-gateways__seg-btn ${ambiente === "sandbox" ? "gp-gateways__seg-btn--ativo" : ""}`}
                onClick={() => setAmbiente("sandbox")}
              >
                Sandbox
              </button>
              <button
                type="button"
                className={`gp-gateways__seg-btn ${ambiente === "producao" ? "gp-gateways__seg-btn--ativo" : ""}`}
                onClick={() => setAmbiente("producao")}
              >
                Produção
              </button>
            </div>
          </div>
          <label className="gp-gateways__campo">
            PV
            <CampoSegredoComOlho value={pv} onChange={(e) => setPv(e.target.value)} />
          </label>
          <label className="gp-gateways__campo">
            Token / client secret
            <CampoSegredoComOlho value={secret} onChange={(e) => setSecret(e.target.value)} />
          </label>
          <Button type="submit" icon={Save} disabled={salvando} className="gp-gateways__salvar">
            {salvando ? "Salvando..." : "Salvar credenciais"}
          </Button>
        </form>
      </section>
    </div>
  );
}
