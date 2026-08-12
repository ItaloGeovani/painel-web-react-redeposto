import { Search } from "lucide-react";

export default function SearchInput({
  value,
  onChange,
  placeholder = "Buscar...",
  className = "",
  ...rest
}) {
  return (
    <div className={`gp-search ${className}`.trim()}>
      <Search size={16} className="gp-search__icon" aria-hidden />
      <input
        type="search"
        className="gp-search__input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        {...rest}
      />
    </div>
  );
}
