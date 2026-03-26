export default function CampoTexto({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete,
  className = "",
  iconePrefixo
}) {
  const rootClass = ["campo", className].filter(Boolean).join(" ");

  return (
    <label htmlFor={id} className={rootClass}>
      <span className="campo__label">{label}</span>
      {iconePrefixo ? (
        <div className="campo__input-wrap">
          <span className="campo__icone" aria-hidden="true">
            {iconePrefixo}
          </span>
          <input
            id={id}
            className="campo__input campo__input--embedded"
            type={type}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoComplete={autoComplete}
          />
        </div>
      ) : (
        <input
          id={id}
          className="campo__input"
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
        />
      )}
    </label>
  );
}
