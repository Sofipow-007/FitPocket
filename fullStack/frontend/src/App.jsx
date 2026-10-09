import "./App.css";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import RutaPrivada from "./components/RutaPrivada";
import RutaPublica from "./components/RutaPublica";

const HomeGuest    = lazy(() => import("./pages/HomeGuest/HomeGuest"));
const Register     = lazy(() => import("./pages/Register/Register"));
const Login        = lazy(() => import("./pages/Login/Login"));
const Recuperar    = lazy(() => import("./pages/Recuperar/Recuperar"));
const Restablecer  = lazy(() => import("./pages/Recuperar/Restablecer"));
const Onboarding1  = lazy(() => import("./pages/Onboarding1/Onboarding1"));
const Onboarding2  = lazy(() => import("./pages/Onboarding2/Onboarding2"));
const Onboarding3  = lazy(() => import("./pages/Onboarding3/Onboarding3"));
const Onboarding4  = lazy(() => import("./pages/Onboarding4/Onboarding4"));
const CargandoPlan = lazy(() => import("./pages/CargandoPlan/CargandoPlan"));
const Dashboard    = lazy(() => import("./pages/Dashboard/Dashboard"));
const PlanDetalle  = lazy(() => import("./pages/PlanDetalle/PlanDetalle"));
const Admin        = lazy(() => import("./pages/Admin/Admin"));

function GlobalLangToggle() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/plan") || pathname.startsWith("/admin")) return null;
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
              <Route path="/recuperar"     element={<RutaPublica><Recuperar /></RutaPublica>} />
              {/* sin RutaPublica: el enlace del mail tiene que abrir aunque haya una sesión vieja guardada */}
              <Route path="/restablecer"   element={<Restablecer />} />
              <Route path="/onboarding"    element={<RutaPrivada><Onboarding1 /></RutaPrivada>} />
              <Route path="/onboarding/2"  element={<RutaPrivada><Onboarding2 /></RutaPrivada>} />
              <Route path="/onboarding/3"  element={<RutaPrivada><Onboarding3 /></RutaPrivada>} />
              <Route path="/onboarding/4"  element={<RutaPrivada><Onboarding4 /></RutaPrivada>} />
              <Route path="/cargando-plan" element={<RutaPrivada><CargandoPlan /></RutaPrivada>} />
              <Route path="/dashboard"     element={<RutaPrivada allowPreview><Dashboard /></RutaPrivada>} />
              <Route path="/plan"          element={<RutaPrivada allowPreview><PlanDetalle /></RutaPrivada>} />
              {/* el rol lo valida el backend: Admin redirige a /dashboard si responde 403 */}
              <Route path="/admin"         element={<RutaPrivada allowPreview><Admin /></RutaPrivada>} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;