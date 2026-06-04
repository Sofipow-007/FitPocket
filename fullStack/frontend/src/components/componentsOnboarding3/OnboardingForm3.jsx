import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OnboardingForm3.css";

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconArrowRight = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

const DIAS = [
  { id: "lunes",    label: "Lun" },
  { id: "martes",   label: "Mar" },
  { id: "miercoles",label: "Mié" },
  { id: "jueves",   label: "Jue" },
  { id: "viernes",  label: "Vie" },
  { id: "sabado",   label: "Sáb" },
  { id: "domingo",  label: "Dom" },
];

const MINUTOS = [
  { value: 30,  label: "30 min" },
  { value: 45,  label: "45 min" },
  { value: 60,  label: "60 min" },
  { value: 90,  label: "90 min" },
];

const DIETAS = [
  { value: "normal",      label: "Sin restricción" },
  { value: "vegetariano", label: "Vegetariano" },
  { value: "vegano",      label: "Vegano" },
  { value: "sinGluten",   label: "Sin gluten" },
];

export default function OnboardingForm3() {
  const navigate = useNavigate();
  const [dias,       setDias]       = useState([]);
  const [minutos,    setMinutos]    = useState(60);
  const [dieta,      setDieta]      = useState("normal");
  const [presupuesto,setPresupuesto]= useState("");
  const [error,      setError]      = useState("");

  const toggleDia = (id) => {
    setDias(prev =>
      prev.includes(id) ? prev.filter(d => d !== id) : [...prev, id]
    );
  };

  const handleSiguiente = () => {
    if (dias.length === 0) { setError("Seleccioná al menos un día disponible."); return; }
    setError("");
    localStorage.setItem("ob_paso3", JSON.stringify({
      diasDispo:         dias,
      minutosPorSesion: minutos,
      tipoDieta:        dieta,
      presupuesto:      presupuesto ? parseFloat(presupuesto) : 0,
    }));
    navigate("/onboarding/4");
  };

  return (
    <div className="ob3-card">
      <div>
        <h1 className="ob3-title">Contanos tu rutina</h1>
        <p className="ob3-subtitle">Adaptamos el plan a tus tiempos y preferencias</p>
      </div>

      {/* Días disponibles */}
      <div className="ob3-section">
        <span className="ob3-label">Días disponibles</span>
        <div className="ob3-chips-row">
          {DIAS.map(dia => (
            <button
              key={dia.id}
              type="button"
              className={`ob3-chip${dias.includes(dia.id) ? " ob3-chip--on" : ""}`}
              onClick={() => toggleDia(dia.id)}
            >
              {dia.label}
            </button>
          ))}
        </div>
        {dias.length > 0 && (
          <span className="ob3-chips-count">
            {dias.length} día{dias.length > 1 ? "s" : ""} seleccionado{dias.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Minutos por sesión */}
      <div className="ob3-section">
        <span className="ob3-label">Minutos por sesión</span>
        <div className="ob3-chips-row">
          {MINUTOS.map(m => (
            <button
              key={m.value}
              type="button"
              className={`ob3-chip${minutos === m.value ? " ob3-chip--on" : ""}`}
              onClick={() => setMinutos(m.value)}
            >
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tipo de dieta */}
      <div className="ob3-section">
        <label className="ob3-label" htmlFor="ob3-dieta">Tipo de dieta</label>
        <div className="ob3-select-wrap">
          <select
            id="ob3-dieta"
            className="ob3-select"
            value={dieta}
            onChange={e => setDieta(e.target.value)}
          >
            {DIETAS.map(d => (
              <option key={d.value} value={d.value}>{d.label}</option>
            ))}
          </select>
          <svg className="ob3-select-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </div>

      {/* Presupuesto */}
      <div className="ob3-section">
        <label className="ob3-label" htmlFor="ob3-presupuesto">
          Presupuesto mensual <span className="ob3-label-opt">(opcional)</span>
        </label>
        <div className="ob3-input-wrap">
          <span className="ob3-input-prefix">ARS $</span>
          <input
            id="ob3-presupuesto"
            type="number"
            className="ob3-input"
            placeholder="0"
            value={presupuesto}
            onChange={e => setPresupuesto(e.target.value)}
            min="0"
          />
        </div>
      </div>

      {error && <p className="ob3-error" role="alert">{error}</p>}
      <div className="ob3-actions">
        <button type="button" className="ob3-btn-back" onClick={() => navigate("/onboarding/2")}>
          <IconArrowLeft /> Anterior
        </button>
        <button type="button" className="ob3-btn-next" onClick={handleSiguiente}>
          Siguiente <IconArrowRight />
        </button>
      </div>
    </div>
  );
}
