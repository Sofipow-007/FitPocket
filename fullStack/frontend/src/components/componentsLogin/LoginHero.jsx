import Navbar from "../NavBar/Navbar";
import "./LoginHero.css";
import { useNavigate } from "react-router-dom";

export default function LoginHero() {
  const navigate = useNavigate();

  return (
    <header className="login-hero">
      <Navbar>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate("/register")}
        >
          Crear cuenta
        </button>
      </Navbar>
    </header>
  );
}
