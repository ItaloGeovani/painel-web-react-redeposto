export default function CampoTexto({
  id,
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  autoComplete
}) {
  return (
    <label htmlFor={id} className="campo">
      <span className="campo__label">{label}</span>
      <input
        id={id}
        className="campo__input"
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        autoComplete={autoComplete}
      />
    </label>
  );
}
