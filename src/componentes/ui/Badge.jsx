import { forwardRef } from "react";

const VARIANTES = {
  success: "gp-badge--success",
  danger: "gp-badge--danger",
  neutral: "gp-badge--neutral",
  warning: "gp-badge--warning"
};

export default function Badge({ children, variant = "neutral", className = "" }) {
  const variante = VARIANTES[variant] || VARIANTES.neutral;
  return <span className={`gp-badge ${variante} ${className}`.trim()}>{children}</span>;
}
