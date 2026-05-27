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
  const [nivel,    setNivel]    = useState("principiante");
  const [loading,  setLoading]  = useState(false);

  const handleSiguiente = async () => {
    if (!objetivo) {
      alert("Seleccioná un objetivo antes de continuar");
      return;
    }

    // Recuperamos los datos del paso 1
    const paso1 = JSON.parse(localStorage.getItem("ob_paso1") || "{}");

    // Armamos el perfil completo
    // Los campos que faltan (días, dieta, etc.) se pueden pedir en pasos 3 y 4
    // o mandar con valores por defecto por ahora
    const perfil = {
      ...paso1,
      objetivo,
      nivel,
      // Valores por defecto hasta que existan los pasos 3 y 4
      diasDisponibles:  ["lunes", "miércoles", "viernes"],
      minutosPorSesion: 60,
      tipoDieta:        "normal",
      presupuesto:      0,
      limitaciones:     [],
    };

    const token = localStorage.getItem("token");

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3001/auth/onboarding", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`, // el endpoint requiere auth
        },
        body: JSON.stringify(perfil),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.error || "Error al guardar el perfil");
        return;
      }

      // Limpiamos los datos temporales del onboarding
      localStorage.removeItem("ob_paso1");

      // Navegamos al dashboard o a la pantalla de carga del plan
      navigate("/cargando-plan");

    } catch (err) {
      console.error(err);
      alert("Error en el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ob2-form">
      <div className="ob2-form__header">
        <span className="ob2-form__paso">Paso 2 de 4</span>
        <h1 className="ob2-form__title">Tu objetivo</h1>
        <p className="ob2-form__subtitle">El plan se diseña alrededor de esta meta</p>
      </div>

      <div className="ob2-form__grid">
        {OBJETIVOS.map((obj) => (
          <button key={obj.id} type="button"
            className={`ob2-obj-card ${objetivo === obj.id ? "ob2-obj-card--selected" : ""}`}
            onClick={() => setObjetivo(obj.id)}
          >
            {objetivo === obj.id && <span className="ob2-obj-card__check">✓</span>}
            <span className="ob2-obj-card__title">{obj.titulo}</span>
            <span className="ob2-obj-card__sub">{obj.subtitulo}</span>
          </button>
        ))}
      </div>

      <div className="ob2-form__nivel">
        <span className="ob2-form__nivel-label">Nivel de experiencia</span>
        <div className="ob2-form__chips">
          {NIVELES.map((n) => (
            <button key={n.id} type="button"
              className={`ob2-chip ${nivel === n.id ? "ob2-chip--selected" : ""}`}
              onClick={() => setNivel(n.id)}
            >
              {n.label}
            </button>
          ))}
        </div>
      </div>

      <div className="ob2-form__actions">
        <button type="button" className="ob2-btn ob2-btn--back" onClick={() => navigate("/onboarding/1")}>
          ← Anterior
        </button>
        <button type="button" className="ob2-btn ob2-btn--next"
          onClick={handleSiguiente} disabled={loading}
        >
          {loading ? "Guardando..." : "Siguiente →"}
        </button>
      </div>
    </div>
  );
}