const VARIANTES = {
  primary: "gp-btn--primary",
  outline: "gp-btn--outline",
  ghost: "gp-btn--ghost",
  danger: "gp-btn--danger"
};

const TAMANHOS = {
  sm: "gp-btn--sm",
  md: "",
  lg: "gp-btn--lg"
};

export default function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  type = "button",
  icon: Icon,
  ...rest
}) {
  const classes = ["gp-btn", VARIANTES[variant] || VARIANTES.primary, TAMANHOS[size] || "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <button type={type} className={classes} {...rest}>
      {Icon ? <Icon size={16} aria-hidden className="gp-btn__icon" /> : null}
      {children}
    </button>
  );
}
