import './Navbar.css';
import logo from '../../assets/fitpocketlogo(inverted).png';

export default function Navbar({ children, showLogo = true }) {
  if (!showLogo && !children) return null;

  return (
    <nav className="navbar">
      {showLogo && (
        <div className="navbar__logo">
          <img src={logo} alt="FitPocket" className="navbar__logo-img" />
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