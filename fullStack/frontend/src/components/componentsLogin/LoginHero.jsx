import Navbar from "../NavBar/Navbar";
import "./LoginHero.css";

export default function LoginHero() {
  return (
    <header className="login-hero">
      <Navbar>
        <button className="btn btn-secondary">Crear cuenta</button>
      </Navbar>
    </header>
  );
}
