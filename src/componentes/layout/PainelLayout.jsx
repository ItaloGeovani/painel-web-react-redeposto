import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { LogOut, Menu } from "lucide-react";
import { agruparMenus } from "../../constantes/menusPorPapel";
import { iconePorMenuId } from "../../constantes/iconesMenu";

/**
 * @param {Array<{ nome: string, path: string, end?: boolean, id?: string, grupo?: string }>} itensMenu
 */
export default function PainelLayout({
  titulo,
  subtitulo,
  usuario,
  itensMenu = [],
  onSair,
  children,
  ocultarCabecalho = false
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  const gruposMenu = useMemo(() => agruparMenus(itensMenu), [itensMenu]);

  function fecharMenu() {
    setMenuAberto(false);
  }

  function renderItem(item) {
    const path = typeof item === "string" ? null : item.path;
    const nome = typeof item === "string" ? item : item.nome;
    const end = typeof item === "object" && item.end === true;
    const menuId =
      typeof item === "object"
        ? item.id || String(path || "").split("/").filter(Boolean).pop()
        : null;
    const Icone = menuId ? iconePorMenuId(menuId) : null;

    if (!path) {
      return (
        <span key={nome} className="painel-menu__item">
          {Icone ? <Icone size={18} className="painel-menu__icone" aria-hidden /> : null}
          {nome}
        </span>
      );
    }

    return (
      <NavLink
        key={path}
        to={path}
        end={end}
        className={({ isActive }) =>
          `painel-menu__item ${isActive ? "painel-menu__item--ativo" : ""}`
        }
        onClick={fecharMenu}
      >
        {Icone ? <Icone size={18} className="painel-menu__icone" aria-hidden /> : null}
        <span>{nome}</span>
      </NavLink>
    );
  }

  return (
    <div className="painel-layout">
      <aside className={`painel-sidebar ${menuAberto ? "painel-sidebar--aberto" : ""}`}>
        <div className="painel-sidebar__topo">
          <h2 className="painel-marca">GasPass</h2>
          <p className="painel-papel">{usuario?.papel || "-"}</p>
          <p className="painel-nome">{usuario?.nome_completo || usuario?.id_usuario || "-"}</p>
        </div>

        <nav className="painel-menu" aria-label="Menu principal">
          {gruposMenu.map((bloco, index) => (
            <div key={bloco.grupo || `grupo-${index}`} className="painel-menu__grupo">
              {bloco.grupo ? (
                <p className="painel-menu__grupo-titulo">{bloco.grupo}</p>
              ) : null}
              <div className="painel-menu__grupo-itens">{bloco.itens.map(renderItem)}</div>
            </div>
          ))}
        </nav>

        <button
          type="button"
          className="painel-sair"
          onClick={() => {
            fecharMenu();
            onSair();
          }}
        >
          <LogOut size={16} aria-hidden />
          Sair
        </button>
      </aside>

      {menuAberto ? <button type="button" className="painel-overlay" onClick={fecharMenu} /> : null}

      <main className="painel-conteudo">
        <div className="painel-conteudo__interno">
          {!ocultarCabecalho ? (
            <header className="painel-cabecalho">
              <button
                type="button"
                className="painel-menu-mobile"
                onClick={() => setMenuAberto((valorAnterior) => !valorAnterior)}
                aria-label="Abrir menu lateral"
              >
                <Menu size={20} />
              </button>

              <div className="painel-cabecalho__textos">
                <h1>{titulo}</h1>
                <p>{subtitulo}</p>
              </div>
            </header>
          ) : (
            <button
              type="button"
              className="painel-menu-mobile painel-menu-mobile--solo"
              onClick={() => setMenuAberto((valorAnterior) => !valorAnterior)}
              aria-label="Abrir menu lateral"
            >
              <Menu size={20} />
            </button>
          )}

          <section>{children}</section>
        </div>
      </main>
    </div>
  );
}
