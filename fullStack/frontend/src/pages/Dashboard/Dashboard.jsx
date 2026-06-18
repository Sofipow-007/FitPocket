import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/fitpocketlogo(inverted).png";
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

function normalize(s = "") {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
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

/* ── Mock data ── */
const EJERCICIOS_MOCK = [
  { nombre: "Press de banca",  series: 4, repeticiones: "8"  },
  { nombre: "Remo con barra",  series: 4, repeticiones: "8"  },
  { nombre: "Sentadilla",      series: 4, repeticiones: "10" },
];

const COMIDA_MOCK = {
  desayuno: { descripcion: "Avena con leche y banana",                       calorias: 350 },
  almuerzo: { descripcion: "Pechuga de pollo con arroz integral y ensalada", calorias: 550 },
  merienda: { descripcion: "Yogur descremado con nueces",                    calorias: 200 },
  cena:     { descripcion: "Huevos revueltos con verduras salteadas",        calorias: 400 },
};

const MOCK_PERFIL = {
  nombre: "Mauro Beltrán",
  email:  "beltran.mauroet36@gmail.com",
  perfil: { peso: 75, altura: 178, edad: 22, sexo: "masculino",
            objetivo: "ganar músculo", nivel: "intermedio",
            minutosPorSesion: 60 },
};

const MOCK_PLAN = {
  meta: { caloriasObjetivoDia: 1500 },
  rutina: DIAS_SEMANA.map((dia, i) => ({
    dia,
    ejercicios: [1, 3, 5, 6].includes(i) ? EJERCICIOS_MOCK : [],
  })),
  dieta: DIAS_SEMANA.map(dia => ({ dia, ...COMIDA_MOCK })),
};

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

/* ── Categorías de ejercicio + ilustraciones ── */
const EX_CATS = {
  push: {
    muscles: { es: "Pecho · Tríceps · Hombros", en: "Chest · Triceps · Shoulders" },
    tip:     { es: "Controlá el descenso. Pausa en el pecho antes de empujar.", en: "Control the descent. Pause at the chest before pushing." },
    illu: (
      <svg viewBox="0 0 90 56" fill="none" aria-hidden="true">
        <rect x="20" y="36" width="55" height="5" rx="2.5" fill="currentColor" opacity="0.2"/>
        <path d="M63 36 L68 50 M68 50 L76 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M26 36 L63 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="22" cy="33" r="5" fill="currentColor"/>
        <path d="M35 36 L35 22 M55 36 L55 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <rect x="8"  y="18" width="68" height="4" rx="2" fill="currentColor" opacity="0.6"/>
        <rect x="4"  y="13" width="6" height="14" rx="2" fill="currentColor"/>
        <rect x="80" y="13" width="6" height="14" rx="2" fill="currentColor"/>
      </svg>
    ),
  },
  pull: {
    muscles: { es: "Espalda · Bíceps · Romboides", en: "Back · Biceps · Rhomboids" },
    tip:     { es: "Retracción escapular al inicio. Codos cerca del cuerpo.", en: "Scapular retraction at the start. Keep elbows close." },
    illu: (
      <svg viewBox="0 0 90 56" fill="none" aria-hidden="true">
        <circle cx="18" cy="14" r="5.5" fill="currentColor"/>
        <path d="M22 18 L58 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <path d="M58 36 L58 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M50 44 L46 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M36 28 L26 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <rect x="18" y="12" width="12" height="8" rx="2" fill="currentColor" opacity="0.55"/>
        <path d="M44 32 L44 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <rect x="40" y="46" width="9" height="6" rx="2" fill="currentColor" opacity="0.55"/>
      </svg>
    ),
  },
  legs: {
    muscles: { es: "Cuádriceps · Glúteos · Isquiotibiales", en: "Quadriceps · Glutes · Hamstrings" },
    tip:     { es: "Rodillas alineadas con los pies. Espalda recta durante todo el movimiento.", en: "Knees aligned with feet. Keep back straight throughout." },
    illu: (
      <svg viewBox="0 0 90 60" fill="none" aria-hidden="true">
        <circle cx="45" cy="7" r="6" fill="currentColor"/>
        <rect x="14" y="13" width="62" height="4" rx="2" fill="currentColor" opacity="0.55"/>
        <rect x="10" y="8" width="6" height="14" rx="2" fill="currentColor"/>
        <rect x="74" y="8" width="6" height="14" rx="2" fill="currentColor"/>
        <path d="M45 17 L45 33" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <path d="M28 15 L36 19 M54 19 L62 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M42 33 L32 46 L28 56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M48 33 L58 46 L62 56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  core: {
    muscles: { es: "Abdomen · Core · Estabilizadores", en: "Abs · Core · Stabilizers" },
    tip:     { es: "Cuerpo en línea recta de cabeza a talones. Respiración constante.", en: "Body in a straight line from head to heels. Constant breathing." },
    illu: (
      <svg viewBox="0 0 90 50" fill="none" aria-hidden="true">
        <circle cx="12" cy="22" r="5" fill="currentColor"/>
        <path d="M16 25 L72 25" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M24 25 L20 36 M40 25 L40 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18 36 L44 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M72 25 L76 36" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M72 36 L80 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
  },
  general: {
    muscles: { es: "Músculos compuestos", en: "Compound muscles" },
    tip:     { es: "Técnica primero, peso después. Controlá cada repetición.", en: "Technique first, then weight. Control each repetition." },
    illu: (
      <svg viewBox="0 0 90 60" fill="none" aria-hidden="true">
        <circle cx="45" cy="8" r="6" fill="currentColor"/>
        <path d="M45 14 L45 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <path d="M45 22 L62 16 L64 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="60" y="2" width="14" height="8" rx="2" fill="currentColor" opacity="0.75"/>
        <path d="M45 22 L30 28 L28 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M43 38 L36 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M47 38 L54 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
    ),
  },
};

function getExCat(nombre) {
  const n = normalize(nombre);
  if (/press|empuje|pecho|hombro|tricep|apert|fondos|dip|push/.test(n))        return "push";
  if (/remo|jal|pull|espalda|bicep|curl|dominada|chin|polea/.test(n))          return "pull";
  if (/sentadilla|squat|pierna|prensa|femoral|gluteo|lunges|zancada|hip/.test(n)) return "legs";
  if (/plancha|plank|abdomen|core|sit.?up|crunch|oblicuo/.test(n))             return "core";
  return "general";
}

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
                  onClick={() => document.getElementById("db-semana")?.scrollIntoView({ behavior: "smooth" })}
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
