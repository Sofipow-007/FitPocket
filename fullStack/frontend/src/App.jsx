import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import HomeGuest   from "./pages/HomeGuest/HomeGuest";
import Register    from "./pages/Register/Register";
import Onboarding1 from "./pages/Onboarding1/Onboarding1";
import Onboarding2 from "./pages/Onboarding2/Onboarding2";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/"            element={<HomeGuest />} />
            <Route path="/register"    element={<Register />} />
            <Route path="/onboarding"  element={<Onboarding1 />} />
            <Route path="/onboarding/2" element={<Onboarding2 />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
