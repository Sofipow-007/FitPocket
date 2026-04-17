import './Navbar.css';

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <h1>FitPocket</h1>
      </div>
      <div className="navbar__actions">
        <button className="btn btn-secondary">Entrar</button>
        <button className="btn btn-primary">Empezar gratis</button>
      </div>
    </nav>
  );
}
