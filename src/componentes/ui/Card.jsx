export default function Card({ children, className = "", accent = false, padding = true }) {
  const classes = [
    "gp-card",
    accent ? "gp-card--accent" : "",
    padding ? "gp-card--pad" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  return <div className={classes}>{children}</div>;
}
