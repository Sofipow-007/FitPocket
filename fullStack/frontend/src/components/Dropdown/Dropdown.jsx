// src/components/DropDown/Dropdown.jsx
import "./Dropdown.css";

export default function Dropdown({ label, options, value, onChange }) {
  return (
    <div className="dropdown">
      <label>{label}</label>
      <select value={value} onChange={onChange}>
        <option value="">Seleccioná</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
