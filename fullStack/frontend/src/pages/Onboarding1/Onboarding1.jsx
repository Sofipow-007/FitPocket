import "./Onboarding1.css";
import { useNavigate } from "react-router-dom";
import OnboardingForm1 from "../../components/componentsOnboarding1/OnboardingForm1";

export default function Onboarding1() {
  const navigate = useNavigate();

  return (
    <div className="ob-page">
      {/* Sticky header */}
      <header className="ob-header">
        <div className="ob-header__top">
          <button className="ob-header__logo" onClick={() => navigate("/")} aria-label="Inicio">
            <span className="ob-header__logo-dot" />
            <span className="ob-header__logo-text">FitPocket</span>
          </button>
          <div className="ob-header__meta">
            <span className="ob-header__step">
              Paso <strong>1</strong> de 4
            </span>
          </div>
        </div>
        <div className="ob-progress">
          <div className="ob-progress__fill" style={{ width: "25%" }} />
        </div>
      </header>

      {/* Form content */}
      <div className="ob-body">
        <OnboardingForm1 />
      </div>
    </div>
  );
}
