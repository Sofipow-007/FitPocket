import './Navbar.css';
import logo from '../../assets/fitpocketlogo(inverted).png';

export default function Navbar({ children, showLogo = true, onLogoClick }) {
  return (
    <nav className="nav">
      {showLogo && (
        <button className="nav__logo" onClick={onLogoClick} aria-label="Inicio">
          <img src={logo} alt="FitPocket" className="nav__logo-img" />
          <span className="nav__logo-text">FitPocket</span>
        </button>
      )}
      <div className="nav__actions">
        {children}
      </div>
    </nav>
  );
}
