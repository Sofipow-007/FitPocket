import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/fitpocketlogo(inverted).png";
import { normalize } from "../../lib/utils";
import { EX_CATS, getExCat } from "../../lib/exerciseCategories";
import { MOCK_PERFIL, MOCK_PLAN } from "../../mocks/planMock";
import "./Dashboard.css";

const DIAS_SEMANA      = ["Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Domingo"];
const DIAS_CORTOS_KEYS = [
  "dashboard.dias.lun", "dashboard.dias.mar", "dashboard.dias.mie",
  "dashboard.dias.jue", "dashboard.dias.vie", "dashboard.dias.sab", "dashboard.dias.dom",
];
const JS_TO_IDX = [6, 0, 1, 2, 3, 4, 5];

function getGreetingKey() {
  const h = new Date().getHours();
  if (h < 12) return "dashboard.saludo.manana";
  if (h < 19) return "dashboard.saludo.tarde";
  return "dashboard.saludo.noche";
}

function getFecha(lang) {
  const locale = lang === "en" ? "en-US" : "es-AR";
  return new Intl.DateTimeFormat(locale, {
    weekday: "long", day: "numeric", month: "long",
  }).format(new Date());
}

function calcImc(peso, altura) {
  if (!peso || !altura) return null;
  return (peso / Math.pow(altura / 100, 2)).toFixed(1);
}

function getNextSession(rutina) {
  if (!rutina?.length) return null;
  const todayIdx = JS_TO_IDX[new Date().getDay()];
  for (let i = 1; i <= 7; i++) {
    const idx     = (todayIdx + i) % 7;
    const diaData = rutina.find(r => normalize(r.dia) === normalize(DIAS_SEMANA[idx]));
    if (diaData?.ejercicios?.length > 0) return idx;
  }
  return null;
}

/* ── Icons ── */
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
    <polyline points="16 17 21 12 16 7"/>
    <line x1="21" y1="12" x2="9" y2="12"/>
  </svg>
);
const IconBolt = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>
  </svg>
);

const IconChevron = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2"
    strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="4 6 8 10 12 6"/>
  </svg>
);

const COMIDAS = [
  { key: "desayuno", tKey: "dashboard.desayuno", dot: "#F97316" },
  { key: "almuerzo", tKey: "dashboard.almuerzo", dot: "#00E887" },
  { key: "merienda", tKey: "dashboard.merienda", dot: "#4F8EF7" },
  { key: "cena",     tKey: "dashboard.cena",     dot: "#A855F7" },
];

export default function Dashboard() {
  const navigate         = useNavigate();
  const { t, i18n }      = useTranslation();
  const [searchParams]   = useSearchParams();
  const isPreview        = searchParams.get("preview") === "true";

  const [loading,    setLoading]    = useState(!isPreview);
  const [perfil,     setPerfil]     = useState(isPreview ? MOCK_PERFIL : null);
  const [plan,       setPlan]       = useState(isPreview ? MOCK_PLAN   : null);
  const [error,      setError]      = useState("");
  const [expandedEx, setExpandedEx] = useState(null);

  useEffect(() => {
    if (isPreview) return;
    const token = localStorage.getItem("token");
    if (!token) { navigate("/"); return; }
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch("http://localhost:3000/users/perfil", { headers }).then(r => r.ok ? r.json() : null),
      fetch("http://localhost:3000/plan/actual",  { headers }).then(r => r.ok ? r.json() : null),
    ])
      .then(([p, pl]) => { setPerfil(p); setPlan(pl); })
      .catch(() => setError("No se pudo cargar tu información. Revisá tu conexión."))
      .finally(() => setLoading(false));
  }, [navigate, isPreview]);

  const todayIdx      = JS_TO_IDX[new Date().getDay()];
  const hoy           = DIAS_SEMANA[todayIdx];
  const nombre        = perfil?.nombre?.split(" ")[0] ?? "";
  const imc           = calcImc(perfil?.perfil?.peso, perfil?.perfil?.altura);
  const calorias      = plan?.meta?.caloriasObjetivoDia ?? null;
  const proximaSesionIdx = getNextSession(plan?.rutina);
  const rutina        = plan?.rutina ?? [];
  const hoyRutina     = rutina.find(r => normalize(r.dia) === normalize(hoy));
  const hoyEntrena    = (hoyRutina?.ejercicios?.length ?? 0) > 0;
  const hoyDieta      = plan?.dieta?.find(d => normalize(d.dia) === normalize(hoy));
  const minutos       = perfil?.perfil?.minutosPorSesion;
  const nivel         = perfil?.perfil?.nivel;

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  return (
    <div className="db-page">

      {/* ── Navbar: perfil | logo | controles ── */}
      <nav className="db-nav">

        {/* Left: perfil */}
        <div className="db-nav__perfil">
          <div className="db-nav__avatar" aria-hidden="true">
            {nombre?.[0]?.toUpperCase() ?? "U"}
          </div>
          <div className="db-nav__userinfo">
            <span className="db-nav__nombre">{perfil?.nombre ?? "—"}</span>
            {nivel && <span className="db-nav__nivel">{nivel}</span>}
          </div>
        </div>

        {/* Center: logo */}
        <img src={logo} alt="FitPocket" className="db-nav__logo" />

        {/* Right: controles */}
        <div className="db-nav__right">
          <div className="db-lang" role="group" aria-label="Idioma">
            <button
              className={`db-lang__btn${i18n.language === "es" ? " db-lang__btn--on" : ""}`}
              onClick={() => { i18n.changeLanguage("es"); localStorage.setItem("idioma", "es"); }}
            >ES</button>
            <button
              className={`db-lang__btn${i18n.language === "en" ? " db-lang__btn--on" : ""}`}
              onClick={() => { i18n.changeLanguage("en"); localStorage.setItem("idioma", "en"); }}
            >EN</button>
          </div>
          <button className="db-nav__logout" onClick={handleLogout} aria-label={t("dashboard.salir")}>
            <IconLogout /><span>{t("dashboard.salir")}</span>
          </button>
        </div>
      </nav>

      <main className="db-main">

        {/* ── Skeleton ── */}
        {loading && (
          <div className="db-skeleton-wrap" aria-busy="true" aria-label="Cargando...">
            <div className="db-sk-hero">
              <div className="db-sk db-sk--title" />
              <div className="db-sk db-sk--today" />
            </div>
            <div className="db-sk db-sk--strip" />
            <div className="db-sk db-sk--block" />
          </div>
        )}

        {!loading && error && <p className="db-error" role="alert">{t("dashboard.errorConexion")}</p>}

        {!loading && !error && (
          <>
            {/* ══ HERO — 2 columnas ══ */}
            <section className="db-hero">

              {/* Col izquierda: saludo + números + CTA */}
              <div className="db-hero__left">
                <div>
                  <h1 className="db-hero__greeting">
                    {t(getGreetingKey())}{nombre ? `, ${nombre}` : ""}.
                  </h1>
                  <p className="db-hero__fecha">{getFecha(i18n.language)}</p>
                </div>

                <div className="db-strip">
                  <div className="db-strip__item db-strip__item--orange">
                    <span className="db-strip__val">—</span>
                    <span className="db-strip__label">{t("dashboard.racha")}</span>
                  </div>
                  <span className="db-strip__sep" aria-hidden="true" />
                  <div className="db-strip__item">
                    <span className="db-strip__val">{calorias ?? "—"}</span>
                    <span className="db-strip__label">{t("dashboard.kcalHoy")}</span>
                  </div>
                  <span className="db-strip__sep" aria-hidden="true" />
                  <div className="db-strip__item db-strip__item--purple">
                    <span className="db-strip__val">{imc ?? "—"}</span>
                    <span className="db-strip__label">{t("dashboard.imc")}</span>
                  </div>
                </div>

                <button
                  className="db-cta"
                  onClick={() => navigate(isPreview ? "/plan?preview=true" : "/plan")}
                >
                  <IconBolt /> {t("dashboard.verPlan")}
                </button>
              </div>

              {/* Col derecha: bloque de hoy */}
              <div className={`db-today${hoyEntrena ? " db-today--activo" : " db-today--descanso"}`}>
                <div className="db-today__head">
                  <span className="db-today__estado">
                    {hoyEntrena ? t("dashboard.entrenarHoy") : t("dashboard.descansoHoy")}
                  </span>
                  {hoyEntrena && minutos && (
                    <span className="db-today__meta">{minutos} min</span>
                  )}
                  {!hoyEntrena && proximaSesionIdx !== null && (
                    <span className="db-today__meta">
                      {t("dashboard.proximaSesion", { dia: t(DIAS_CORTOS_KEYS[proximaSesionIdx]) })}
                    </span>
                  )}
                </div>

                {hoyEntrena && hoyRutina?.ejercicios?.length > 0 ? (
                  <ul className="db-today__ejercicios" aria-label={t("dashboard.entrenarHoy")}>
                    {hoyRutina.ejercicios.slice(0, 3).map((ej, i) => {
                      const cat    = getExCat(ej.nombre);
                      const info   = EX_CATS[cat];
                      const isOpen = expandedEx === i;
                      return (
                        <li key={i} className={`db-today__ejercicio${isOpen ? " db-today__ejercicio--open" : ""}`}>
                          <button
                            className="db-today__ej-row"
                            onClick={() => setExpandedEx(isOpen ? null : i)}
                            aria-expanded={isOpen}
                          >
                            <span className="db-today__ej-n">{String(i + 1).padStart(2, "0")}</span>
                            <span className="db-today__ej-nom">{ej.nombre}</span>
                            {ej.series && (
                              <span className="db-today__ej-meta">{ej.series}×{ej.repeticiones}</span>
                            )}
                            <span className="db-today__ej-chevron"><IconChevron /></span>
                          </button>
                          {isOpen && (
                            <div className="db-today__ej-detail">
                              <div className="db-today__ej-illu">{info.illu}</div>
                              <div className="db-today__ej-info">
                                <span className="db-today__ej-muscles">
                                  {t(`ejercicios.${cat}.muscles`)}
                                </span>
                                <span className="db-today__ej-tip">
                                  {t(`ejercicios.${cat}.tip`)}
                                </span>
                              </div>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                ) : !hoyEntrena ? (
                  <p className="db-today__rest-sub">{t("dashboard.recuperate")}</p>
                ) : null}
              </div>
            </section>

            {/* ══ SEMANA — tira de puntos ══ */}
            <section className="db-section" id="db-semana">
              <h2 className="db-section__title">{t("dashboard.semana")}</h2>
              <div className="db-week" role="list" aria-label={t("dashboard.semana")}>
                {DIAS_SEMANA.map((dia, idx) => {
                  const diaData = rutina.find(r => normalize(r.dia) === normalize(dia));
                  const entrena = (diaData?.ejercicios?.length ?? 0) > 0;
                  const esHoy   = dia === hoy;
                  return (
                    <div
                      key={dia}
                      role="listitem"
                      className={`db-wday${esHoy ? " db-wday--hoy" : ""}${entrena ? " db-wday--entrena" : ""}`}
                    >
                      <span className="db-wday__nom">{t(DIAS_CORTOS_KEYS[idx])}</span>
                      <span className="db-wday__dot" aria-hidden="true" />
                      {esHoy && <span className="db-wday__hoy-tag">{t("dashboard.hoy")}</span>}
                    </div>
                  );
                })}
              </div>
            </section>

            {/* ══ DIETA — timeline vertical ══ */}
            <section className="db-section">
              <h2 className="db-section__title">{t("dashboard.dietaHoy")}</h2>
              <div className="db-timeline">
                {COMIDAS.map(({ key, tKey, dot }, idx) => {
                  const comida = hoyDieta?.[key] ?? hoyDieta?.comida?.[key] ?? null;
                  const isLast = idx === COMIDAS.length - 1;
                  return (
                    <div key={key} className="db-tl-row">
                      <div className="db-tl-row__gutter" aria-hidden="true">
                        <span className="db-tl-row__dot" style={{ background: dot }} />
                        {!isLast && <span className="db-tl-row__line" />}
                      </div>
                      <div className="db-tl-row__content">
                        <div className="db-tl-row__head">
                          <span className="db-tl-row__label">{t(tKey)}</span>
                          {comida?.calorias && (
                            <span className="db-tl-row__kcal">{comida.calorias} kcal</span>
                          )}
                        </div>
                        <p className="db-tl-row__desc">
                          {comida?.descripcion ?? t("dashboard.sinPlan")}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
