import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import "./CargandoPlan.css";
import logo from "../../assets/fitpocketlogo(inverted).png";

export default function CargandoPlan() {
  const { t }        = useTranslation();
  const PASOS        = t("cargando.pasos", { returnObjects: true });
  const [pasoActual, setPasoActual] = useState(0);
  const [progreso,   setProgreso]   = useState(0);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reducedMotion) {
      setProgreso(50);
      setPasoActual(2);
      return;
    }

    const total = 14000;
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

        <p className="cp-step">{PASOS[pasoActual]}</p>

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
