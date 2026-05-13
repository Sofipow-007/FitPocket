import "./App.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login/Login";
import Register from "./pages/Register/Register";
import Onboarding1 from "./pages/Onboarding1/Onboarding1";


function App() {
  return (
    <BrowserRouter>
      <div className="App">
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/onboarding/1" element={<Onboarding1 />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}

export default App;