import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink } from "react-router-dom";
import { ChevronDown, LogOut, MoreHorizontal, UserRound } from "lucide-react";
import { iconePorMenuId } from "../../constantes/iconesMenu";
import { logoRedeUrl, nomeRedeDisplay } from "../../utilitarios/redeBranding";

/**
 * Topbar corporativa do GasPass PDV — marca da rede logada à esquerda.
 */
export default function DesktopHeader({
  itensMenu = [],
  usuario,
  postoNome,
  rede,
  onSair
}) {
  const [maisAberto, setMaisAberto] = useState(false);
  const [userAberto, setUserAberto] = useState(false);
  const [logoOk, setLogoOk] = useState(true);
  const maisRef = useRef(null);
  const userRef = useRef(null);

  const redeNome = nomeRedeDisplay(rede);
  const logoSrc = logoRedeUrl(rede);

  useEffect(() => {
    setLogoOk(true);
  }, [logoSrc]);

  const secundarios = useMemo(
    () => itensMenu.filter((item) => item.id !== "ler-voucher" && item.id !== "vouchers"),
    [itensMenu]
  );
  const principais = useMemo(
    () => itensMenu.filter((item) => item.id === "ler-voucher" || item.id === "vouchers"),
    [itensMenu]
  );

  useEffect(() => {
    function onDoc(e) {
      if (!maisRef.current?.contains(e.target)) setMaisAberto(false);
      if (!userRef.current?.contains(e.target)) setUserAberto(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function renderNav(item) {
    return (
      <NavLink
        key={item.path}
        to={item.path}
        end={item.end === true}
        className={({ isActive }) =>
          `gp-pdv-nav__item ${isActive ? "gp-pdv-nav__item--ativo" : ""}`
        }
        onClick={() => setMaisAberto(false)}
      >
        <span>{item.nome.replace(/^Validar voucher$/i, "Validar")}</span>
      </NavLink>
    );
  }

  const nome = usuario?.nome_completo || usuario?.id_usuario || "Frentista";

  return (
    <header className="gp-pdv-header">
      <div className="gp-pdv-header__marca" title={redeNome}>
        {logoOk ? (
          <img
            src={logoSrc}
            alt=""
            className="gp-pdv-header__logo"
            onError={() => setLogoOk(false)}
          />
        ) : null}
        <strong className="gp-pdv-header__nome gp-pdv-header__nome--rede">{redeNome}</strong>
      </div>

      <nav className="gp-pdv-nav gp-pdv-nav--largos" aria-label="Menu PDV">
        {itensMenu.map(renderNav)}
      </nav>

      <nav className="gp-pdv-nav gp-pdv-nav--estreitos" aria-label="Menu PDV compacto">
        {principais.map(renderNav)}
        <div className="gp-pdv-mais" ref={maisRef}>
          <button
            type="button"
            className={`gp-pdv-nav__item ${maisAberto ? "gp-pdv-nav__item--ativo" : ""}`}
            aria-expanded={maisAberto}
            onClick={() => setMaisAberto((v) => !v)}
          >
            <MoreHorizontal size={18} aria-hidden />
            <span>Mais</span>
          </button>
          {maisAberto ? (
            <div className="gp-pdv-mais__menu" role="menu">
              {secundarios.map((item) => {
                const Icone = item.id ? iconePorMenuId(item.id) : null;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    role="menuitem"
                    className={({ isActive }) =>
                      `gp-pdv-mais__link ${isActive ? "gp-pdv-mais__link--ativo" : ""}`
                    }
                    onClick={() => setMaisAberto(false)}
                  >
                    {Icone ? <Icone size={16} aria-hidden /> : null}
                    {item.nome}
                  </NavLink>
                );
              })}
            </div>
          ) : null}
        </div>
      </nav>

      <div className="gp-pdv-header__direita" ref={userRef}>
        <button
          type="button"
          className="gp-pdv-user-btn"
          aria-expanded={userAberto}
          onClick={() => setUserAberto((v) => !v)}
        >
          <span className="gp-pdv-user-btn__avatar" aria-hidden>
            <UserRound size={16} />
          </span>
          <span className="gp-pdv-user-btn__texto">
            <strong>{nome}</strong>
            <small>{postoNome || "Posto"}</small>
          </span>
          <ChevronDown size={14} aria-hidden />
        </button>
        {userAberto ? (
          <div className="gp-pdv-user-menu" role="menu">
            <button type="button" className="gp-pdv-user-menu__item" disabled>
              Minha conta
            </button>
            <button type="button" className="gp-pdv-user-menu__item" disabled>
              Trocar posto
            </button>
            <button type="button" className="gp-pdv-user-menu__item" disabled>
              Configurações
            </button>
            <button
              type="button"
              className="gp-pdv-user-menu__item gp-pdv-user-menu__item--sair"
              onClick={() => {
                setUserAberto(false);
                onSair?.();
              }}
            >
              <LogOut size={14} aria-hidden /> Sair
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}
