import { useState } from "react";
import "./OnboardingForm2.css";
import { useNavigate } from "react-router-dom";

const OBJETIVOS = [
  {
    id: "grasa",
    titulo: "Perder grasa",
    subtitulo: "Déficit calórico + cardio progresivo",
  },
  {
    id: "musculo",
    titulo: "Ganar músculo",
    subtitulo: "Superávit calórico + entrenamiento de fuerza",
  },
  {
    id: "resistencia",
    titulo: "Resistencia",
    subtitulo: "Cardio progresivo y zona aeróbica",
  },
  {
    id: "salud",
    titulo: "Salud general",
    subtitulo: "Balance entre fuerza, cardio y bienestar",
  },
];

const NIVELES = ["Principiante", "Intermedio", "Avanzado"];

export default function OnboardingForm2() {
  const navigate = useNavigate();
  const [objetivo, setObjetivo] = useState(null);
  const [nivel, setNivel] = useState("Principiante");

  return (
    <div className="ob2-form">

      {/* Encabezado */}
      <div className="ob2-form__header">
        <span className="ob2-form__paso">Paso 2 de 4</span>
        <h1 className="ob2-form__title">Tu objetivo</h1>
        <p className="ob2-form__subtitle">
          El plan se diseña alrededor de esta meta
        </p>
      </div>

      {/* Grid de objetivos */}
      <div className="ob2-form__grid">
        {OBJETIVOS.map((obj) => (
          <button
            key={obj.id}
            type="button"
            className={`ob2-obj-card ${objetivo === obj.id ? "ob2-obj-card--selected" : ""}`}
            onClick={() => setObjetivo(obj.id)}
          >
            {objetivo === obj.id && (
              <span className="ob2-obj-card__check">✓</span>
            )}
            <span className="ob2-obj-card__title">{obj.titulo}</span>
            <span className="ob2-obj-card__sub">{obj.subtitulo}</span>
          </button>
        ))}
      </div>

      {/* Nivel de experiencia */}
      <div className="ob2-form__nivel">
        <span className="ob2-form__nivel-label">Nivel de experiencia</span>
        <div className="ob2-form__chips">
          {NIVELES.map((n) => (
            <button
              key={n}
              type="button"
              className={`ob2-chip ${nivel === n ? "ob2-chip--selected" : ""}`}
              onClick={() => setNivel(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {/* Navegación */}
      <div className="ob2-form__actions">
        <button
          type="button"
          className="ob2-btn ob2-btn--back"
          onClick={() => navigate("/onboarding1")}
        >
          ← Anterior
        </button>
        <button
          type="button"
          className="ob2-btn ob2-btn--next"
          onClick={() => navigate("/onboarding/3")}
        >
          Siguiente →
        </button>
      </div>
    </div>
  );
}
