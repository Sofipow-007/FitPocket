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
  const [reducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);
  const [pasoActual, setPasoActual] = useState(reducedMotion ? 2 : 0);
  const [progreso, setProgreso] = useState(reducedMotion ? 50 : 0);
  const [estado, setEstado] = useState("generando");
  const [error, setError] = useState("");

  useEffect(() => {
    if (reducedMotion) return;

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
  }, [reducedMotion, PASOS.length]);

  useEffect(() => {
    let isMounted = true;

    const generarPlan = async () => {
      const token = localStorage.getItem("token");

      if (!token) {
        if (isMounted) {
          setEstado("error");
          setError(t("cargando.errorSesion"));
        }
        return;
      }

      try {
        const { ok, data } = await pedirPlan(token);

        if (!ok) {
          throw new Error(data.error || t("cargando.errorGenerico"));
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
          setError(err.message || t("cargando.errorGenerico"));
        }
      }
    };

    generarPlan();

    return () => {
      isMounted = false;
    };
  }, [navigate, t, PASOS.length]);

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
            ? t("cargando.errorTitulo")
            : PASOS[pasoActual]}
        </p>

        {error && <p className="cp-step cp-step--error" role="alert">{error}</p>}

        {estado === "error" && (
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="cp-retry"
          >
            {t("cargando.reintentar")}
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
