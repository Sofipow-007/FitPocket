import './Navbar.css';

export default function Navbar({ children }) {
  return (
    <nav className="navbar">
      <div className="navbar__logo">
        <h1>FitPocket</h1>
      </div>
      {children && (
        <div className="navbar__extra">
          {children}
        </div>
      )}
    </nav>
  );
}
