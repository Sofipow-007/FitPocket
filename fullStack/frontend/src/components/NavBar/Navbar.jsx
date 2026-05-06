import './Navbar.css';

export default function Navbar({ children, showLogo = true }) {
  if (!showLogo && !children) return null; // no renderiza nada si no hay contenido

  return (
    <nav className="navbar">
      {showLogo && (
        <div className="navbar__logo">
          <h1>FitPocket</h1>
        </div>
      )}
      {children && (
        <div className="navbar__extra">
          {children}
        </div>
      )}
    </nav>
  );
}
