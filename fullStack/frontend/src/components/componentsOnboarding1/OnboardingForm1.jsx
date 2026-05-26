import { useState, useEffect } from "react";
import Dropdown from "../DropDown/Dropdown";
import { useNavigate } from "react-router-dom";
import "./OnboardingForm1.css";

const SEX_OPTIONS = [
  { value: "femenino", label: "Femenino" },
  { value: "masculino", label: "Masculino" },
];

function getIMCCategory(imc) {
  if (imc < 18.5) return { label: "Bajo peso", color: "var(--vio2)" };
  if (imc < 25)   return { label: "Normal",    color: "var(--ok)" };
  if (imc < 30)   return { label: "Sobrepeso", color: "var(--warn)" };
  return             { label: "Obesidad",   color: "var(--err)" };
}

export default function OnboardingForm1() {
  const navigate = useNavigate();
  const [edad,   setEdad]   = useState("");
  const [peso,   setPeso]   = useState("");
  const [altura, setAltura] = useState("");
  const [sexo,   setSexo]   = useState("");
  const [imc,    setImc]    = useState(null);

  useEffect(() => {
    const p = parseFloat(peso);
    const h = parseFloat(altura);
    if (p > 0 && h > 0) {
      const val = p / Math.pow(h / 100, 2);
      setImc(parseFloat(val.toFixed(1)));
    } else {
      setImc(null);
    }
  }, [peso, altura]);

  const categoria = imc ? getIMCCategory(imc) : null;

  return (
    <div className="ob-form1">

      {/* Encabezado */}
      <div className="ob-form1__header">
        <span className="ob-form1__paso">Paso 1 de 4</span>
        <h1 className="ob-form1__title">Tu cuerpo</h1>
        <p className="ob-form1__subtitle">
          Calculamos tu IMC y personalizamos el plan
        </p>
      </div>

      <form className="ob-form1__form" onSubmit={e => e.preventDefault()}>

        {/* Fila 1: edad / peso / altura */}
        <div className="ob-form1__row3">
          <div className="ob-form1__field">
            <label className="ob-form1__label">Edad</label>
            <input
              type="number"
              className="ob-form1__input"
              placeholder="Años"
              value={edad}
              onChange={e => setEdad(e.target.value)}
              min="10" max="99"
            />
          </div>
          <div className="ob-form1__field">
            <label className="ob-form1__label">Peso (kg)</label>
            <input
              type="number"
              className="ob-form1__input"
              placeholder="kg"
              value={peso}
              onChange={e => setPeso(e.target.value)}
              min="30" max="300"
            />
          </div>
          <div className="ob-form1__field">
            <label className="ob-form1__label">Altura (cm)</label>
            <input
              type="number"
              className="ob-form1__input"
              placeholder="cm"
              value={altura}
              onChange={e => setAltura(e.target.value)}
              min="100" max="250"
            />
          </div>
        </div>

        {/* Fila 2: sexo + IMC card */}
        <div className="ob-form1__row2">
          <div className="ob-form1__field">
            <label className="ob-form1__label">Sexo</label>
            <Dropdown
              label="Sexo"
              options={SEX_OPTIONS}
              value={sexo}
              onChange={setSexo}
            />
          </div>

          {/* IMC Card */}
          <div className="ob-form1__imc-card">
            <span className="ob-form1__imc-label">IMC Estimado</span>
            <span
              className="ob-form1__imc-val"
              style={{ color: categoria?.color ?? "var(--ink4)" }}
            >
              {imc ?? "—"}
            </span>
            <span
              className="ob-form1__imc-cat"
              style={{ color: categoria?.color ?? "var(--ink4)" }}
            >
              {categoria?.label ?? "Ingresá datos"}
            </span>
          </div>
        </div>

        {/* Botón siguiente */}
        <div className="ob-form1__actions">
          <button
            type="button"
            className="ob-form1__btn-next"
            onClick={() => navigate("/onboarding/2")}  // ← navega al paso 2
          >
            Siguiente →
          </button>
        </div>

      </form>
    </div>
  );
}
