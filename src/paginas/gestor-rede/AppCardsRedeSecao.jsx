import { useCallback, useEffect, useState } from "react";
import { URL_BASE_API } from "../../configuracao/apiConfig";
import { listarAppCardsRede, salvarAppCardsRede } from "../../servicos/appCardsServico";
import { toastErro, toastSucesso } from "../../servicos/toastServico";

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

export default function AppCardsRedeSecao({ redeId }) {
  const [cards, setCards] = useState(() => [0, 1, 2, 3].map(cardVazio));
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const bloco = await listarAppCardsRede();
      const lista = bloco?.lista ?? [];
      setCards(mesclarLista(lista));
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

  async function onSubmit(e) {
    e.preventDefault();
    setSalvando(true);
    try {
      const payload = cards.map((c) => ({
        slot: c.slot,
        titulo: c.titulo,
        imagem_url: c.imagem_url,
        link_url: c.link_url,
        ativo: c.ativo
      }));
      await salvarAppCardsRede(payload);
      toastSucesso("Cards do app salvos.");
      await carregar();
    } catch (err) {
      toastErro(err.message || "Falha ao salvar.");
    } finally {
      setSalvando(false);
    }
  }

  function atualizar(slot, campo, valor) {
    setCards((prev) =>
      prev.map((c) => (c.slot === slot ? { ...c, [campo]: valor } : c))
    );
  }

  const urlPublica = `${URL_BASE_API}/v1/public/rede-cards?id_rede=${encodeURIComponent(redeId || "")}`;

  if (carregando) {
    return (
      <article className="card-resumo">
        <p>Carregando cards do app...</p>
      </article>
    );
  }

  const rotulos = [
    { slot: 0, nome: "Card destaque (rede)", ajuda: "Banner principal sobre a rede de postos." },
    { slot: 1, nome: "Promocao 1", ajuda: "Primeiro card de promocao." },
    { slot: 2, nome: "Promocao 2", ajuda: "Segundo card de promocao." },
    { slot: 3, nome: "Promocao 3", ajuda: "Terceiro card de promocao." }
  ];

  return (
    <div className="gestor-relatorios">
      <p className="rede-detalhes__ajuda" style={{ marginBottom: 16 }}>
        Defina URLs de imagens (https) para o app do cliente. O app consumira o endpoint publico abaixo (sem login).
      </p>
      <p className="rede-detalhes__ajuda rede-detalhes__ajuda--form" style={{ marginBottom: 20 }}>
        <strong>Endpoint publico:</strong>{" "}
        <code style={{ wordBreak: "break-all" }}>{urlPublica}</code>
      </p>

      <form className="form-rede form-rede--equipe" onSubmit={onSubmit}>
        {rotulos.map(({ slot, nome, ajuda }) => {
          const c = cards.find((x) => x.slot === slot) || cardVazio(slot);
          return (
            <fieldset
              key={slot}
              className="form-rede__grid form-rede__input-span2"
              style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: 16, marginBottom: 16 }}
            >
              <legend style={{ padding: "0 8px", fontWeight: 600 }}>
                {nome} — slot {slot}
              </legend>
              <p className="rede-detalhes__ajuda" style={{ gridColumn: "1 / -1", marginBottom: 8 }}>
                {ajuda}
              </p>
              <input
                className="campo__input"
                placeholder="Titulo (opcional)"
                value={c.titulo}
                onChange={(e) => atualizar(slot, "titulo", e.target.value)}
                aria-label={`Titulo ${nome}`}
              />
              <label className="form-rede__radio-linha">
                <input
                  type="checkbox"
                  checked={c.ativo}
                  onChange={(e) => atualizar(slot, "ativo", e.target.checked)}
                />
                Ativo no app
              </label>
              <input
                className="campo__input form-rede__input-span2"
                placeholder="URL da imagem (https://...)"
                type="url"
                value={c.imagem_url}
                onChange={(e) => atualizar(slot, "imagem_url", e.target.value)}
                aria-label={`Imagem ${nome}`}
              />
              <input
                className="campo__input form-rede__input-span2"
                placeholder="Link ao tocar (opcional, https://...)"
                type="url"
                value={c.link_url}
                onChange={(e) => atualizar(slot, "link_url", e.target.value)}
                aria-label={`Link ${nome}`}
              />
              {c.imagem_url ? (
                <div className="form-rede__input-span2" style={{ marginTop: 8 }}>
                  <span className="form-rede__titulo-aux">Previa</span>
                  <img
                    src={c.imagem_url}
                    alt=""
                    style={{ maxWidth: 320, maxHeight: 160, objectFit: "contain", borderRadius: 6 }}
                    loading="lazy"
                    onError={(e) => {
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              ) : null}
            </fieldset>
          );
        })}
        <div className="form-rede__acoes form-rede__input-span2">
          <button className="botao-primario" type="submit" disabled={salvando}>
            {salvando ? "Salvando..." : "Salvar cards"}
          </button>
        </div>
      </form>
    </div>
  );
}
