import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Suspense, lazy } from "react";

const HomeGuest    = lazy(() => import("./pages/HomeGuest/HomeGuest"));
const Register     = lazy(() => import("./pages/Register/Register"));
const Login        = lazy(() => import("./pages/Login/Login"));
const Onboarding1  = lazy(() => import("./pages/Onboarding1/Onboarding1"));
const Onboarding2  = lazy(() => import("./pages/Onboarding2/Onboarding2"));
const Onboarding3  = lazy(() => import("./pages/Onboarding3/Onboarding3"));
const Onboarding4  = lazy(() => import("./pages/Onboarding4/Onboarding4"));
const CargandoPlan = lazy(() => import("./pages/CargandoPlan/CargandoPlan"));

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <main className="main-content">
          <Suspense fallback={<div className="loading-page">Cargando...</div>}>
            <Routes>
              <Route path="/"              element={<HomeGuest />} />
              <Route path="/register"      element={<Register />} />
              <Route path="/login"         element={<Login />} />
              <Route path="/onboarding"    element={<Onboarding1 />} />
              <Route path="/onboarding/2"  element={<Onboarding2 />} />
              <Route path="/onboarding/3"  element={<Onboarding3 />} />
              <Route path="/onboarding/4"  element={<Onboarding4 />} />
              <Route path="/cargando-plan" element={<CargandoPlan />} />
            </Routes>
          </Suspense>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;