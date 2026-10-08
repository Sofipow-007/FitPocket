import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import "./CargandoPlan.css";
import logo from "../../assets/fitpocketlogo(inverted).png";

// Un solo pedido en vuelo por pestaña: en dev, StrictMode monta el componente
// dos veces y sin esto se generaban (y cobraban a Groq) dos planes por usuario.
let generacionEnCurso = null;

const pedirPlan = (token) => {
  if (!generacionEnCurso) {
    generacionEnCurso = fetch(`${API_URL}/plan/generar`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then(async (response) => ({
        ok: response.ok,
        data: await response.json().catch(() => ({})),
      }))
      .finally(() => {
        generacionEnCurso = null;
      });
  }
  return generacionEnCurso;
};

export default function CargandoPlan() {
  const navigate = useNavigate();
  const { t }        = useTranslation();
  const PASOS        = t("cargando.pasos", { returnObjects: true });
  const [pasoActual, setPasoActual] = useState(0);
  const [progreso, setProgreso] = useState(0);
  const [estado, setEstado] = useState("generando");
  const [error, setError] = useState("");

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setProgreso(50);
      setPasoActual(2);
      return;
    }

    const total = 30000;
    const interval = 120;
    let elapsed = 0;

    const timer = setInterval(() => {
      elapsed += interval;
      const pct = Math.min((elapsed / total) * 100, 97);
      setProgreso(Math.round(pct));
      setPasoActual(Math.min(Math.floor((pct / 100) * PASOS.length), PASOS.length - 1));
    }, interval);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const generarPlan = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (isMounted) {
          setEstado("error");
          setError("No hay sesión activa. Iniciá sesión para generar tu plan.");
        }
        return;
      }

      try {
        const { ok, data } = await pedirPlan(token);

        if (!ok) {
          throw new Error(data.error || "No se pudo generar el plan");
        }

        if (isMounted) {
          setEstado("exito");
          setProgreso(100);
          setPasoActual(PASOS.length - 1);
          window.setTimeout(() => navigate("/dashboard", { replace: true }), 1200);
        }
      } catch (err) {
        if (isMounted) {
          setEstado("error");
          setError(err.message || "Ocurrió un error inesperado al generar el plan.");
        }
      }
    };

    generarPlan();

    return () => {
      isMounted = false;
    };
  }, [navigate]);

  return (
    <div className="cp-page">
      <div className="cp-orb cp-orb--1" />
      <div className="cp-orb cp-orb--2" />

      <div className="cp-content">
        <div className="cp-logo">
          <img src={logo} alt="" className="cp-logo__img" />
          <span className="cp-logo__text">FitPocket</span>
        </div>

        <div className="cp-ring-wrap">
          <svg className="cp-ring" viewBox="0 0 120 120">
            <defs>
              <linearGradient id="cp-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="#00E887" />
                <stop offset="100%" stopColor="#4F8EF7" />
              </linearGradient>
            </defs>
            <circle className="cp-ring__bg"    cx="60" cy="60" r="52" />
            <circle
              className="cp-ring__fill"
              cx="60" cy="60" r="52"
              strokeDasharray={`${2 * Math.PI * 52}`}
              strokeDashoffset={`${2 * Math.PI * 52 * (1 - progreso / 100)}`}
            />
          </svg>
          <div className="cp-ring__center">
            <span className="cp-ring__pct">{progreso}%</span>
          </div>
        </div>

        <p className="cp-step">
          {estado === "error"
            ? "No pudimos generar tu plan"
            : PASOS[pasoActual]}
        </p>

        {error && <p className="cp-step" style={{ color: "#ff6b6b", fontSize: "0.95rem", marginTop: "0.5rem" }}>{error}</p>}

        {estado === "error" && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{ marginTop: "1rem", padding: "0.75rem 1.25rem", border: "none", borderRadius: "999px", background: "#00E887", color: "#07111f", fontWeight: 700, cursor: "pointer" }}
          >
            Reintentar
          </button>
        )}

        <div className="cp-steps-list">
          {PASOS.map((paso, i) => (
            <div key={i} className={`cp-step-item${i <= pasoActual ? " cp-step-item--done" : ""}`}>
              <span className="cp-step-item__dot" />
              <span className="cp-step-item__text">{paso}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
