import { useState } from "react";

export default function PainelLayout({
  titulo,
  subtitulo,
  usuario,
  itensMenu = [],
  itemMenuAtivo = "",
  onSelecionarMenu,
  onSair,
  children
}) {
  const [menuAberto, setMenuAberto] = useState(false);

  function fecharMenu() {
    setMenuAberto(false);
  }

  return (
    <div className="painel-layout">
      <aside className={`painel-sidebar ${menuAberto ? "painel-sidebar--aberto" : ""}`}>
        <div className="painel-sidebar__topo">
          <h2 className="painel-marca">GasPass</h2>
          <p className="painel-papel">{usuario?.papel || "-"}</p>
          <p className="painel-nome">{usuario?.nome_completo || usuario?.id_usuario || "-"}</p>
        </div>

        <nav className="painel-menu">
          {itensMenu.map((item) => (
            <button
              key={item}
              type="button"
              className={`painel-menu__item ${itemMenuAtivo === item ? "painel-menu__item--ativo" : ""}`}
              onClick={() => {
                if (onSelecionarMenu) {
                  onSelecionarMenu(item);
                }
                fecharMenu();
              }}
            >
              {item}
            </button>
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
          Sair
        </button>
      </aside>

      {menuAberto ? <button type="button" className="painel-overlay" onClick={fecharMenu} /> : null}

      <main className="painel-conteudo">
        <div className="painel-conteudo__interno">
          <header className="painel-cabecalho">
            <button
              type="button"
              className="painel-menu-mobile"
              onClick={() => setMenuAberto((valorAnterior) => !valorAnterior)}
              aria-label="Abrir menu lateral"
            >
              ☰
            </button>

            <div className="painel-cabecalho__textos">
              <h1>{titulo}</h1>
              <p>{subtitulo}</p>
            </div>
          </header>

          <section>{children}</section>
        </div>
      </main>
    </div>
  );
}
