import { useCallback, useEffect, useMemo, useState } from "react";
import { Image as ImageIcon, Images, Sparkles } from "lucide-react";
import { listarAppCardsRede, salvarAppCardsRede } from "../../servicos/appCardsServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";
import CampoImagemUrl from "../../componentes/CampoImagemUrl";
import Button from "../../componentes/ui/Button";
import Badge from "../../componentes/ui/Badge";

function cardVazio(slot) {
  return { slot, titulo: "", imagem_url: "", link_url: "", ativo: true };
}

function mesclarLista(lista) {
  const porSlot = new Map((lista || []).map((c) => [c.slot, c]));
  return [0, 1, 2, 3].map((slot) => {
    const c = porSlot.get(slot);
    return c
      ? {
          slot: c.slot,
          titulo: c.titulo ?? "",
          imagem_url: c.imagem_url ?? "",
          link_url: c.link_url ?? "",
          ativo: Boolean(c.ativo)
        }
      : cardVazio(slot);
  });
}

function statusImagem(c) {
  if (!c.ativo) return { label: "Desligado", variant: "neutral" };
  if (String(c.imagem_url || "").trim()) return { label: "Com imagem", variant: "success" };
  if (c.slot >= 1) return { label: "Usa padrão no app", variant: "warning" };
  return { label: "Sem imagem", variant: "neutral" };
}

function EditorCard({
  card,
  titulo,
  subtitulo,
  badgeExtra,
  onChange,
  placeholderTitulo = "Título (opcional)"
}) {
  const st = statusImagem(card);
  const temImg = Boolean(String(card.imagem_url || "").trim());

  return (
    <article className={`gp-app-cards__card ${card.ativo ? "" : "gp-app-cards__card--off"}`}>
      <header className="gp-app-cards__card-cab">
        <div>
          <h4 className="gp-app-cards__card-titulo">{titulo}</h4>
          {subtitulo ? <p className="gp-app-cards__card-sub">{subtitulo}</p> : null}
        </div>
        <div className="gp-app-cards__badges">
          {badgeExtra}
          <Badge variant={st.variant}>{st.label}</Badge>
        </div>
      </header>

      <label className="gp-app-cards__toggle">
        <input
          type="checkbox"
          checked={card.ativo}
          onChange={(e) => onChange("ativo", e.target.checked)}
        />
        <span>Visível no app</span>
      </label>

      <label className="gp-app-cards__campo">
        Título
        <input
          className="campo__input"
          placeholder={placeholderTitulo}
          value={card.titulo}
          onChange={(e) => onChange("titulo", e.target.value)}
        />
      </label>

      <div className="gp-app-cards__campo">
        <span className="gp-app-cards__campo-label">Imagem</span>
        <CampoImagemUrl
          value={card.imagem_url}
          onChange={(url) => onChange("imagem_url", url)}
          mostrarPrevia={false}
          placeholder="Cole a URL ou envie um arquivo"
        />
        {card.slot >= 1 && !temImg ? (
          <p className="gp-app-cards__dica">
            Sem URL: o app mostra a imagem padrão local (padrao{card.slot}.png) até você enviar uma.
          </p>
        ) : null}
      </div>

      <label className="gp-app-cards__campo">
        Link ao tocar (opcional)
        <input
          className="campo__input"
          type="url"
          placeholder="https://..."
          value={card.link_url}
          onChange={(e) => onChange("link_url", e.target.value)}
        />
      </label>

      <div className="gp-app-cards__previa" aria-hidden={!temImg}>
        {temImg ? (
          <img
            src={card.imagem_url}
            alt=""
            loading="lazy"
            onError={(e) => {
              e.currentTarget.style.visibility = "hidden";
            }}
          />
        ) : (
          <div className="gp-app-cards__previa-vazia">
            <ImageIcon size={28} />
            <span>{card.slot >= 1 ? `Padrão ${card.slot} no app` : "Sem prévia"}</span>
          </div>
        )}
      </div>
    </article>
  );
}

export default function AppCardsRedeSecao({ redeId }) {
  const [cards, setCards] = useState(() => [0, 1, 2, 3].map(cardVazio));
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const bloco = await listarAppCardsRede();
      setCards(mesclarLista(bloco?.lista ?? []));
    } catch (err) {
      toastErro(err.message || "Falha ao carregar cards.");
      setCards([0, 1, 2, 3].map(cardVazio));
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    carregar();
  }, [carregar, redeId]);

  const destaque = useMemo(() => cards.find((c) => c.slot === 0) || cardVazio(0), [cards]);
  const promos = useMemo(
    () => [1, 2, 3].map((s) => cards.find((c) => c.slot === s) || cardVazio(s)),
    [cards]
  );

  const resumoCarrossel = useMemo(() => {
    const ativos = promos.filter((p) => p.ativo).length;
    const comImg = promos.filter((p) => p.ativo && String(p.imagem_url || "").trim()).length;
    return { ativos, comImg };
  }, [promos]);

  function atualizar(slot, campo, valor) {
    setCards((prev) => prev.map((c) => (c.slot === slot ? { ...c, [campo]: valor } : c)));
  }

  async function onSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      await salvarAppCardsRede(
        cards.map((c) => ({
          slot: c.slot,
          titulo: c.titulo,
          imagem_url: c.imagem_url,
          link_url: c.link_url,
          ativo: c.ativo
        }))
      );
      toastSucesso("Cards do app salvos.");
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  if (carregando) {
    return (
      <div className="gp-app-cards">
        <p className="gp-app-cards__ajuda">Carregando cards do app…</p>
      </div>
    );
  }

  return (
    <form className="gp-app-cards" onSubmit={onSubmit}>
      <header className="gp-app-cards__intro">
        <div className="gp-app-cards__intro-icon" aria-hidden>
          <Images size={22} />
        </div>
        <div>
          <h3 className="gp-app-cards__intro-titulo">Imagens da home do app</h3>
          <p className="gp-app-cards__ajuda">
            São <strong>duas áreas diferentes</strong>: o destaque da rede (marca) e o{" "}
            <strong>carrossel com até 3 promoções</strong>. O carrossel só mostra os cards ativos;
            sem URL de imagem, a promoção ainda aparece com a imagem padrão do app.
          </p>
        </div>
      </header>

      <section className="gp-app-cards__secao" aria-labelledby="app-cards-destaque">
        <div className="gp-app-cards__secao-cab">
          <Sparkles size={18} aria-hidden />
          <div>
            <h3 id="app-cards-destaque">1. Destaque da rede</h3>
            <p>Usado como marca / banner da rede no app (não entra no carrossel).</p>
          </div>
        </div>
        <EditorCard
          card={destaque}
          titulo="Destaque"
          subtitulo="Uma imagem principal da rede"
          onChange={(campo, valor) => atualizar(0, campo, valor)}
          placeholderTitulo="Ex.: Rede Lucena+"
        />
      </section>

      <section className="gp-app-cards__secao" aria-labelledby="app-cards-carrossel">
        <div className="gp-app-cards__secao-cab">
          <Images size={18} aria-hidden />
          <div>
            <h3 id="app-cards-carrossel">2. Carrossel de promoções</h3>
            <p>
              Três slides na home do cliente. Agora:{" "}
              <strong>
                {resumoCarrossel.ativos} ativo{resumoCarrossel.ativos === 1 ? "" : "s"}
              </strong>
              , {resumoCarrossel.comImg} com imagem própria
              {resumoCarrossel.ativos - resumoCarrossel.comImg > 0
                ? ` (${resumoCarrossel.ativos - resumoCarrossel.comImg} usam padrão)`
                : ""}
              .
            </p>
          </div>
        </div>

        <div className="gp-app-cards__grid-promos">
          {promos.map((p) => (
            <EditorCard
              key={p.slot}
              card={p}
              titulo={`Promoção ${p.slot}`}
              subtitulo={`Slide ${p.slot} do carrossel`}
              badgeExtra={<Badge variant="neutral">Slide {p.slot}</Badge>}
              onChange={(campo, valor) => atualizar(p.slot, campo, valor)}
              placeholderTitulo={`Título da promoção ${p.slot}`}
            />
          ))}
        </div>
      </section>

      <div className="gp-app-cards__acoes">
        <Button type="submit" disabled={salvando}>
          {salvando ? "Salvando…" : "Salvar cards"}
        </Button>
      </div>
    </form>
  );
}
