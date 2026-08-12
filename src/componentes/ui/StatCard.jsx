export default function StatCard({ title, value, description, icon: Icon }) {
  return (
    <div className="gp-stat">
      {Icon ? (
        <div className="gp-stat__icon" aria-hidden>
          <Icon size={20} />
        </div>
      ) : null}
      <div className="gp-stat__body">
        <p className="gp-stat__title">{title}</p>
        <strong className="gp-stat__value">{value}</strong>
        {description ? <p className="gp-stat__desc">{description}</p> : null}
      </div>
    </div>
  );
}
