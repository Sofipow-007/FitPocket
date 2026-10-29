import Navbar from "../NavBar/Navbar";
import "./RegisterHero.css";
import { useNavigate } from "react-router-dom";

export default function RegisterHero() {
  const navigate = useNavigate();

  return (
    <header className="register-hero">
      <Navbar>
        <button 
          className="btn btn-secondary" 
          onClick={() => navigate("/login")}
        >
          Ya tengo una cuenta
        </button>
      </Navbar>
    </header>
  );
}
