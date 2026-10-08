import "./App.css";
import { BrowserRouter, Routes, Route, Link, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import RutaPrivada from "./components/RutaPrivada";
import RutaPublica from "./components/RutaPublica";

const HomeGuest    = lazy(() => import("./pages/HomeGuest/HomeGuest"));
const Register     = lazy(() => import("./pages/Register/Register"));
const Login        = lazy(() => import("./pages/Login/Login"));
const Onboarding1  = lazy(() => import("./pages/Onboarding1/Onboarding1"));
const Onboarding2  = lazy(() => import("./pages/Onboarding2/Onboarding2"));
const Onboarding3  = lazy(() => import("./pages/Onboarding3/Onboarding3"));
const Onboarding4  = lazy(() => import("./pages/Onboarding4/Onboarding4"));
const CargandoPlan = lazy(() => import("./pages/CargandoPlan/CargandoPlan"));
const Dashboard    = lazy(() => import("./pages/Dashboard/Dashboard"));
const PlanDetalle  = lazy(() => import("./pages/PlanDetalle/PlanDetalle"));

const DEV_PAGES = [
  { path: "/dashboard?preview=true", label: "Dashboard" },
  { path: "/plan?preview=true",      label: "Plan detalle" },
];

function DevPanel() {
  const { pathname } = useLocation();
  const hide = ["/dashboard", "/cargando-plan", "/plan"].some(p => pathname.startsWith(p));
  if (hide) return null;
  return (
    <div className="dev-panel" style={{
      position: "fixed", bottom: 20, right: 20, zIndex: 9999,
      background: "rgba(6,6,14,0.92)", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: 14, padding: "10px 14px", display: "flex", flexDirection: "column", gap: 6,
      backdropFilter: "blur(12px)", boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
    }}>
      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", fontWeight: 700, letterSpacing: "0.08em", marginBottom: 2 }}>
        PREVIEW
      </span>
      {DEV_PAGES.map(({ path, label }) => (
        <Link
          key={path}
          to={path}
          style={{
            fontSize: 13, fontWeight: 600, color: "#00E887", textDecoration: "none",
            padding: "5px 10px", borderRadius: 8, background: "rgba(0,232,135,0.08)",
            transition: "background 150ms",
          }}
          onMouseEnter={e => e.currentTarget.style.background = "rgba(0,232,135,0.18)"}
          onMouseLeave={e => e.currentTarget.style.background = "rgba(0,232,135,0.08)"}
        >
          → {label}
        </Link>
      ))}
    </div>
  );
}

function GlobalLangToggle() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/plan")) return null;
  const set = (lang) => { i18n.changeLanguage(lang); localStorage.setItem("idioma", lang); };
  const enOnboarding = pathname.startsWith("/onboarding");
  return (
    <div className={`g-lang${enOnboarding ? " g-lang--onboarding" : ""}`} role="group" aria-label={t("comun.idioma")}>
      <button className={`g-lang__btn${i18n.language === "es" ? " g-lang__btn--on" : ""}`} onClick={() => set("es")}>ES</button>
      <button className={`g-lang__btn${i18n.language === "en" ? " g-lang__btn--on" : ""}`} onClick={() => set("en")}>EN</button>
    </div>
  );
}

function App() {
  const { t } = useTranslation();
  return (
    <BrowserRouter>
      <div className="App">
        <GlobalLangToggle />
        <main className="main-content">
          <Suspense fallback={<div className="loading-page">{t("comun.cargando")}</div>}>
            <Routes>
              <Route path="/"              element={<RutaPublica><HomeGuest /></RutaPublica>} />
              <Route path="/register"      element={<RutaPublica><Register /></RutaPublica>} />
              <Route path="/login"         element={<RutaPublica><Login /></RutaPublica>} />
              <Route path="/onboarding"    element={<RutaPrivada><Onboarding1 /></RutaPrivada>} />
              <Route path="/onboarding/2"  element={<RutaPrivada><Onboarding2 /></RutaPrivada>} />
              <Route path="/onboarding/3"  element={<RutaPrivada><Onboarding3 /></RutaPrivada>} />
              <Route path="/onboarding/4"  element={<RutaPrivada><Onboarding4 /></RutaPrivada>} />
              <Route path="/cargando-plan" element={<RutaPrivada><CargandoPlan /></RutaPrivada>} />
              <Route path="/dashboard"     element={<RutaPrivada allowPreview><Dashboard /></RutaPrivada>} />
              <Route path="/plan"          element={<RutaPrivada allowPreview><PlanDetalle /></RutaPrivada>} />
            </Routes>
          </Suspense>
        </main>
        {import.meta.env.DEV && <DevPanel />}
      </div>
    </BrowserRouter>
  );
}

export default App;