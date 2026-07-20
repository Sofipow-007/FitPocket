import { useState, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/fitpocketlogo(inverted).png";
import { normalize } from "../../lib/utils";
import { EX_CATS, getExCat } from "../../lib/exerciseCategories";
import { MOCK_PLAN } from "../../mocks/planMock";
import "./PlanDetalle.css";

const DIAS_SEMANA = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_CORTOS_KEYS = [
  "dashboard.dias.lun", "dashboard.dias.mar", "dashboard.dias.mie",
  "dashboard.dias.jue", "dashboard.dias.vie", "dashboard.dias.sab", "dashboard.dias.dom",
];
const JS_TO_IDX = [6, 0, 1, 2, 3, 4, 5];

const COMIDAS = [
  { key: "desayuno", tKey: "dashboard.desayuno", dot: "#F97316" },
  { key: "almuerzo", tKey: "dashboard.almuerzo", dot: "#00E887" },
  { key: "merienda", tKey: "dashboard.merienda", dot: "#4F8EF7" },
  { key: "cena",     tKey: "dashboard.cena",     dot: "#A855F7" },
];

/* ── Icons ── */
const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);
const IconChevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="4 6 8 10 12 6" />
  </svg>
);
const IconSwap = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="17 1 21 5 17 9" /><path d="M3 11V9a4 4 0 0 1 4-4h14" />
    <polyline points="7 23 3 19 7 15" /><path d="M21 13v2a4 4 0 0 1-4 4H3" />
  </svg>
);
const IconClock = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="9" /><polyline points="12 7 12 12 15.5 14" />
  </svg>
);

export default function PlanDetalle() {
  const navigate       = useNavigate();
  const { t, i18n }    = useTranslation();
  const [searchParams] = useSearchParams();
  const isPreview      = searchParams.get("preview") === "true";

  const [loading,  setLoading]  = useState(!isPreview);
  const [plan,     setPlan]     = useState(isPreview ? MOCK_PLAN : null);
  const [error,    setError]    = useState("");
  const [expandedEx, setExpandedEx] = useState(null);
  /* swapState: { [diaIndex-ejercicioIndex]: alternativaIndex (0 = original) } */
  const [swapState, setSwapState] = useState({});

  useEffect(() => {
    if (isPreview) return;
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    fetch("http://localhost:3000/plan/actual", { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(setPlan)
      .catch(() => setError("No se pudo cargar tu plan. Revisá tu conexión."))
      .finally(() => setLoading(false));
  }, [navigate, isPreview]);

  const todayIdx = JS_TO_IDX[new Date().getDay()];
  const [selectedIdx, setSelectedIdx] = useState(todayIdx);

  const rutina = plan?.rutina ?? [];
  const dieta  = plan?.dieta  ?? [];

  const diaSeleccionado = DIAS_SEMANA[selectedIdx];
  const rutinaDia = rutina.find(r => normalize(r.dia) === normalize(diaSeleccionado));
  const dietaDia  = dieta.find(d => normalize(d.dia) === normalize(diaSeleccionado));
  const entrenaEseDia = (rutinaDia?.ejercicios?.length ?? 0) > 0;

  const ejerciciosMostrados = useMemo(() => {
    if (!rutinaDia?.ejercicios) return [];
    return rutinaDia.ejercicios.map((ej, i) => {
      const key = `${selectedIdx}-${i}`;
      const altIdx = swapState[key] ?? 0;
      if (altIdx === 0 || !ej.alternativas?.length) return ej;
      return ej.alternativas[altIdx - 1] ?? ej;
    });
  }, [rutinaDia, swapState, selectedIdx]);

  const handleSwap = (i) => {
    const ej = rutinaDia.ejercicios[i];
    const totalOpciones = 1 + (ej.alternativas?.length ?? 0);
    if (totalOpciones <= 1) return;
    const key = `${selectedIdx}-${i}`;
    setSwapState(s => ({ ...s, [key]: ((s[key] ?? 0) + 1) % totalOpciones }));
  };

  return (
    <div className="pd-page">
      <nav className="pd-nav">
        <button
          className="pd-nav__back"
          onClick={() => navigate(isPreview ? "/dashboard?preview=true" : "/dashboard")}
          aria-label={t("plan.volver")}
        >
          <IconBack /> <span>{t("plan.volver")}</span>
        </button>
        <img src={logo} alt="FitPocket" className="pd-nav__logo" />
        <div className="pd-lang" role="group" aria-label="Idioma">
          <button
            className={`pd-lang__btn${i18n.language === "es" ? " pd-lang__btn--on" : ""}`}
            onClick={() => { i18n.changeLanguage("es"); localStorage.setItem("idioma", "es"); }}
          >ES</button>
          <button
            className={`pd-lang__btn${i18n.language === "en" ? " pd-lang__btn--on" : ""}`}
            onClick={() => { i18n.changeLanguage("en"); localStorage.setItem("idioma", "en"); }}
          >EN</button>
        </div>
      </nav>

      <main className="pd-main">
        {loading && (
          <div className="pd-skeleton-wrap" aria-busy="true" aria-label="Cargando...">
            <div className="pd-sk pd-sk--title" />
            <div className="pd-sk pd-sk--tabs" />
            <div className="pd-sk pd-sk--block" />
          </div>
        )}

        {!loading && error && <p className="pd-error" role="alert">{t("plan.errorConexion")}</p>}

        {!loading && !error && !plan && (
          <p className="pd-error" role="alert">{t("plan.sinPlan")}</p>
        )}

        {!loading && !error && plan && (
          <>
            <h1 className="pd-title">{t("plan.titulo")}</h1>
            {plan.meta?.objetivo && (
              <p className="pd-subtitle">
                {t("plan.objetivo")}: <strong>{plan.meta.objetivo}</strong>
                {plan.meta?.caloriasObjetivoDia && ` · ${plan.meta.caloriasObjetivoDia} kcal/día`}
              </p>
            )}

            {/* ── Selector de día ── */}
            <div className="pd-days" role="group" aria-label={t("plan.dias")}>
              {DIAS_SEMANA.map((dia, idx) => {
                const diaData = rutina.find(r => normalize(r.dia) === normalize(dia));
                const entrena = (diaData?.ejercicios?.length ?? 0) > 0;
                const esHoy   = idx === todayIdx;
                const activo  = idx === selectedIdx;
                return (
                  <button
                    key={dia}
                    type="button"
                    aria-pressed={activo}
                    className={`pd-day${activo ? " pd-day--activo" : ""}${entrena ? " pd-day--entrena" : ""}`}
                    onClick={() => setSelectedIdx(idx)}
                  >
                    <span className="pd-day__nom">{t(DIAS_CORTOS_KEYS[idx])}</span>
                    <span className="pd-day__dot" aria-hidden="true" />
                    {esHoy && <span className="pd-day__hoy-tag">{t("dashboard.hoy")}</span>}
                  </button>
                );
              })}
            </div>

            {/* ── Rutina del día seleccionado ── */}
            <section className="pd-section">
              {entrenaEseDia ? (
                <>
                  <div className="pd-day-head">
                    <h2 className="pd-day-head__tipo">{rutinaDia.tipo || t("plan.entrenamiento")}</h2>
                    {rutinaDia.duracionMinutos && (
                      <span className="pd-day-head__dur"><IconClock /> {rutinaDia.duracionMinutos} min</span>
                    )}
                  </div>

                  <ul className="pd-ex-list">
                    {ejerciciosMostrados.map((ej, i) => {
                      const original = rutinaDia.ejercicios[i];
                      const cat      = getExCat(ej.nombre);
                      const info     = EX_CATS[cat];
                      const isOpen   = expandedEx === i;
                      const hasAlts  = (original.alternativas?.length ?? 0) > 0;
                      const key      = `${selectedIdx}-${i}`;
                      const isSwapped = (swapState[key] ?? 0) !== 0;
                      return (
                        <li key={i} className={`pd-ex${isOpen ? " pd-ex--open" : ""}`}>
                          <button
                            className="pd-ex__row"
                            onClick={() => setExpandedEx(isOpen ? null : i)}
                            aria-expanded={isOpen}
                          >
                            <span className="pd-ex__n">{String(i + 1).padStart(2, "0")}</span>
                            <span className="pd-ex__nom">
                              {ej.nombre}
                              {isSwapped && <span className="pd-ex__swapped-tag">{t("plan.reemplazado")}</span>}
                            </span>
                            {ej.series && (
                              <span className="pd-ex__meta">{ej.series}×{ej.repeticiones}</span>
                            )}
                            <span className="pd-ex__chevron"><IconChevron /></span>
                          </button>

                          {isOpen && (
                            <div className="pd-ex__detail">
                              <div className="pd-ex__illu">{info.illu}</div>
                              <div className="pd-ex__info">
                                <span className="pd-ex__muscles">{t(`ejercicios.${cat}.muscles`)}</span>
                                {ej.descansoSegundos != null && (
                                  <span className="pd-ex__descanso">{t("plan.descanso")}: {ej.descansoSegundos}s</span>
                                )}
                                {ej.nota && <span className="pd-ex__nota">{ej.nota}</span>}
                                {hasAlts && (
                                  <button className="pd-ex__swap-btn" onClick={() => handleSwap(i)}>
                                    <IconSwap /> {t("plan.cambiarEjercicio")}
                                  </button>
                                )}
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </>
              ) : (
                <p className="pd-rest">{t("plan.descansoDia")}</p>
              )}
            </section>

            {/* ── Dieta del día seleccionado ── */}
            <section className="pd-section">
              <h2 className="pd-section__title">{t("plan.dietaDia")}</h2>
              <div className="pd-timeline">
                {COMIDAS.map(({ key, tKey, dot }, idx) => {
                  const comida = dietaDia?.[key] ?? dietaDia?.comida?.[key] ?? null;
                  const isLast = idx === COMIDAS.length - 1;
                  return (
                    <div key={key} className="pd-tl-row">
                      <div className="pd-tl-row__gutter" aria-hidden="true">
                        <span className="pd-tl-row__dot" style={{ background: dot }} />
                        {!isLast && <span className="pd-tl-row__line" />}
                      </div>
                      <div className="pd-tl-row__content">
                        <div className="pd-tl-row__head">
                          <span className="pd-tl-row__label">{t(tKey)}</span>
                          {comida?.calorias && <span className="pd-tl-row__kcal">{comida.calorias} kcal</span>}
                        </div>
                        <p className="pd-tl-row__desc">{comida?.descripcion ?? t("dashboard.sinPlan")}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              {dietaDia?.costoEstimadoDia != null && (
                <p className="pd-costo">{t("plan.costoEstimado")}: ${dietaDia.costoEstimadoDia.toLocaleString(i18n.language === "en" ? "en-US" : "es-AR")}</p>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
