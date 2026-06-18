import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./OnboardingForm2.css";

/* ── SVG Icons ─────────────────────────────────────────────────── */
const IconFlame = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M8.5 14.5A2.5 2.5 0 0011 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 11-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 002.5 3z" />
  </svg>
);
const IconDumbbell = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M6.5 6.5h11M6.5 17.5h11M3 9V6a1 1 0 011-1h1a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1v-3M21 9V6a1 1 0 00-1-1h-1a1 1 0 00-1 1v12a1 1 0 001 1h1a1 1 0 001-1v-3" />
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
  </svg>
);
const IconHeart = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const IconCheck = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
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

const OBJETIVOS = [
  { id: "perder grasa",  tKey: "ob2.obj.perderGrasa",  icon: <IconFlame />    },
  { id: "ganar músculo", tKey: "ob2.obj.ganarMusculo", icon: <IconDumbbell /> },
  { id: "resistencia",   tKey: "ob2.obj.resistencia",  icon: <IconBolt />     },
  { id: "salud general", tKey: "ob2.obj.saludGeneral", icon: <IconHeart />    },
];

const NIVELES = [
  { id: "principiante", tKey: "ob2.nivel.principiante" },
  { id: "intermedio",   tKey: "ob2.nivel.intermedio"   },
  { id: "avanzado",     tKey: "ob2.nivel.avanzado"     },
];

export default function OnboardingForm2() {
  const navigate    = useNavigate();
  const { t }       = useTranslation();
  const [objetivo, setObjetivo] = useState(null);
  const [nivel,    setNivel]    = useState("principiante");

  const [error, setError] = useState("");

  const handleSiguiente = () => {
    if (!objetivo) { setError(t("ob2.errorObjetivo")); return; }
    setError("");
    localStorage.setItem("ob_paso2", JSON.stringify({ objetivo, nivel }));
    navigate("/onboarding/3");
  };

  return (
    <div className="ob2-card">
      <div>
        <h1 className="ob2-header__title">{t("ob2.titulo")}</h1>
        <p className="ob2-header__subtitle">{t("ob2.subtitulo")}</p>
      </div>

      <div className="ob2-grid">
        {OBJETIVOS.map(obj => (
          <button
            key={obj.id}
            type="button"
            className={`ob2-obj-card${objetivo === obj.id ? " ob2-obj-card--selected" : ""}`}
            onClick={() => setObjetivo(obj.id)}
          >
            <div className="ob2-obj-card__icon">{obj.icon}</div>
            {objetivo === obj.id && (
              <span className="ob2-obj-card__check"><IconCheck /></span>
            )}
            <span className="ob2-obj-card__title">{t(`${obj.tKey}.titulo`)}</span>
            <span className="ob2-obj-card__sub">{t(`${obj.tKey}.sub`)}</span>
          </button>
        ))}
      </div>

      <div className="ob2-nivel">
        <span className="ob2-nivel__label">{t("ob2.nivelLabel")}</span>
        <div className="ob2-chips">
          {NIVELES.map(n => (
            <button
              key={n.id}
              type="button"
              className={`ob2-chip${nivel === n.id ? " ob2-chip--selected" : ""}`}
              onClick={() => setNivel(n.id)}
            >
              {t(n.tKey)}
            </button>
          ))}
        </div>
      </div>

      {error && <p className="ob2-error" role="alert">{error}</p>}
      <div className="ob2-actions">
        <button type="button" className="ob2-btn-back" onClick={() => navigate("/onboarding")}>
          <IconArrowLeft /> {t("ob2.anterior")}
        </button>
        <button
          type="button"
          className="ob2-btn-next"
          onClick={handleSiguiente}
        >
          {t("ob2.siguiente")} <IconArrowRight />
        </button>
      </div>
    </div>
  );
}
