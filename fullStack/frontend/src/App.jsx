import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Onboarding1 from "./pages/Onboarding1/Onboarding1";
import HomeGuest from "./pages/HomeGuest/HomeGuest";

function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<HomeGuest />} />
            <Route path="/onboarding" element={<Onboarding1 />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;
