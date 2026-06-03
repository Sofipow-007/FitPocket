import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeGuest    from "./pages/HomeGuest/HomeGuest";
import Register     from "./pages/Register/Register";
import Onboarding1  from "./pages/Onboarding1/Onboarding1";
import Onboarding2  from "./pages/Onboarding2/Onboarding2";
import Onboarding3  from "./pages/Onboarding3/Onboarding3";
import Onboarding4  from "./pages/Onboarding4/Onboarding4";
import CargandoPlan from "./pages/CargandoPlan/CargandoPlan";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/"              element={<HomeGuest />} />
            <Route path="/register"      element={<Register />} />
            <Route path="/onboarding"    element={<Onboarding1 />} />
            <Route path="/onboarding/2"  element={<Onboarding2 />} />
            <Route path="/onboarding/3"  element={<Onboarding3 />} />
            <Route path="/onboarding/4"  element={<Onboarding4 />} />
            <Route path="/cargando-plan" element={<CargandoPlan />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
