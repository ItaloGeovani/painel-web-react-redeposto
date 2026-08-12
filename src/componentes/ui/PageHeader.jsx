export default function PageHeader({ icon: Icon, title, subtitle, breadcrumb = [] }) {
  return (
    <div className="gp-page-header">
      <div className="gp-page-header__main">
        {Icon ? (
          <div className="gp-page-header__icon" aria-hidden>
            <Icon size={28} />
          </div>
        ) : null}
        <div>
          <h2 className="gp-page-header__title">{title}</h2>
          {subtitle ? <p className="gp-page-header__subtitle">{subtitle}</p> : null}
        </div>
      </div>
      {breadcrumb.length > 0 ? (
        <nav className="gp-breadcrumb" aria-label="Breadcrumb">
          {breadcrumb.map((item, index) => (
            <span key={`${item}-${index}`} className="gp-breadcrumb__item">
              {index > 0 ? <span className="gp-breadcrumb__sep">›</span> : null}
              <span className={index === breadcrumb.length - 1 ? "gp-breadcrumb__atual" : undefined}>
                {item}
              </span>
            </span>
          ))}
        </nav>
      ) : null}
    </div>
  );
}
