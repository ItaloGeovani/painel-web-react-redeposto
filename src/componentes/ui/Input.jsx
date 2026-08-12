import { forwardRef } from "react";

const Input = forwardRef(function Input(
  { className = "", label, id, ...rest },
  ref
) {
  return (
    <label className={`gp-field ${className}`.trim()} htmlFor={id}>
      {label ? <span className="gp-field__label">{label}</span> : null}
      <input ref={ref} id={id} className="gp-input" {...rest} />
    </label>
  );
});

export default Input;
