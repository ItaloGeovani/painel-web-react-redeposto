export default function BotaoPrimario({ children, type = "button", disabled }) {
  return (
    <button type={type} className="botao-primario" disabled={disabled}>
      {children}
    </button>
  );
}
