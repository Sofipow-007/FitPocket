import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./OnboardingForm4.css";

const IconArrowLeft = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconSparkle = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16">
    <path d="M12 2l1.5 4.5L18 8l-4.5 1.5L12 14l-1.5-4.5L6 8l4.5-1.5L12 2z" />
    <path d="M19 14l.75 2.25L22 17l-2.25.75L19 20l-.75-2.25L16 17l2.25-.75L19 14z" />
    <path d="M5 17l.5 1.5L7 19l-1.5.5L5 21l-.5-1.5L3 19l1.5-.5L5 17z" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);

const LIMITACIONES = [
  { id: "lumbar",       label: "Dolor lumbar" },
  { id: "rodilla",      label: "Rodilla operada" },
  { id: "hombro",       label: "Hombro" },
  { id: "asma",         label: "Asma" },
  { id: "hipertension", label: "Hipertensión" },
  { id: "ninguna",      label: "Ninguna" },
];

export default function OnboardingForm4() {
  const navigate = useNavigate();
  const [limitaciones, setLimitaciones] = useState([]);
  const [aclaracion,   setAclaracion]   = useState("");
  const [loading,      setLoading]      = useState(false);
  const [apiError,     setApiError]     = useState("");

  const toggleLimitacion = (id) => {
    if (id === "ninguna") {
      setLimitaciones(prev => prev.includes("ninguna") ? [] : ["ninguna"]);
      return;
    }
    setLimitaciones(prev => {
      const sinNinguna = prev.filter(l => l !== "ninguna");
      return sinNinguna.includes(id)
        ? sinNinguna.filter(l => l !== id)
        : [...sinNinguna, id];
    });
  };

  const handleGenerar = async () => {
    const paso1 = JSON.parse(localStorage.getItem("ob_paso1") || "{}");
    const paso2 = JSON.parse(localStorage.getItem("ob_paso2") || "{}");
    const paso3 = JSON.parse(localStorage.getItem("ob_paso3") || "{}");

    const perfil = {
      ...paso1,
      ...paso2,
      ...paso3,
      limitaciones: limitaciones.filter(l => l !== "ninguna"),
      aclaracion:   aclaracion.trim(),
    };

    const token = localStorage.getItem("token");
    setLoading(true);
    setApiError("");
    try {
      const res  = await fetch("http://localhost:3000/users/onboarding", {
        method:  "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body:    JSON.stringify(perfil),
      });
      const data = await res.json();
      if (!res.ok) { setApiError(data.error || "No pudimos guardar tu perfil. Intentá de nuevo."); return; }
      localStorage.removeItem("ob_paso1");
      localStorage.removeItem("ob_paso2");
      localStorage.removeItem("ob_paso3");
      navigate("/cargando-plan");
    } catch {
      setApiError("No hay conexión con el servidor. Revisá tu conexión e intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ob4-card">
      <div>
        <h1 className="ob4-title">¿Algo que debamos saber?</h1>
        <p className="ob4-subtitle">Evitamos ejercicios que puedan causarte molestias</p>
      </div>

      {/* Chips limitaciones */}
      <div className="ob4-section">
        <span className="ob4-label">Limitaciones físicas</span>
        <div className="ob4-chips-row">
          {LIMITACIONES.map(lim => (
            <button
              key={lim.id}
              type="button"
              className={`ob4-chip${limitaciones.includes(lim.id) ? " ob4-chip--on" : ""}${lim.id === "ninguna" ? " ob4-chip--none" : ""}`}
              onClick={() => toggleLimitacion(lim.id)}
            >
              {limitaciones.includes(lim.id) && lim.id !== "ninguna" && (
                <span className="ob4-chip__check"><IconCheck /></span>
              )}
              {lim.label}
            </button>
          ))}
        </div>
      </div>

      {/* Aclaración adicional */}
      <div className="ob4-section">
        <label className="ob4-label" htmlFor="ob4-aclaracion">
          Aclaración adicional <span className="ob4-label-opt">(opcional)</span>
        </label>
        <textarea
          id="ob4-aclaracion"
          className="ob4-textarea"
          placeholder="Ej: operé la rodilla derecha en 2022, puedo caminar pero no correr..."
          value={aclaracion}
          onChange={e => setAclaracion(e.target.value)}
          rows={3}
          maxLength={400}
        />
        {aclaracion.length > 0 && (
          <span className="ob4-char-count">{aclaracion.length}/400</span>
        )}
      </div>

      {/* Card de confirmación */}
      <div className="ob4-confirm-card">
        <div className="ob4-confirm-card__icon">
          <IconShield />
        </div>
        <div>
          <p className="ob4-confirm-card__title">Todo listo.</p>
          <p className="ob4-confirm-card__sub">Tu plan se generará en 8–20 segundos.</p>
        </div>
      </div>

      {apiError && <p className="ob4-api-error" role="alert">{apiError}</p>}
      <div className="ob4-actions">
        <button type="button" className="ob4-btn-back" onClick={() => navigate("/onboarding/3")}>
          <IconArrowLeft /> Anterior
        </button>
        <button
          type="button"
          className="ob4-btn-generate"
          onClick={handleGenerar}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="ob4-spinner" /> Generando...
            </>
          ) : (
            <>
              <IconSparkle /> Generar mi plan
            </>
          )}
        </button>
      </div>
    </div>
  );
}
