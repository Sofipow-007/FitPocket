import "../Onboarding1/Onboarding1.css";
import "./Onboarding2.css";
import { useNavigate } from "react-router-dom";
import OnboardingForm2 from "../../components/componentsOnboarding2/OnboardingForm2";

export default function Onboarding2() {
  const navigate = useNavigate();

  return (
    <div className="ob-page">
      <header className="ob-header">
        <div className="ob-header__top">
          <button className="ob-header__logo" onClick={() => navigate("/")} aria-label="Inicio">
            <span className="ob-header__logo-dot" />
            <span className="ob-header__logo-text">FitPocket</span>
          </button>
          <div className="ob-header__meta">
            <span className="ob-header__step">
              Paso <strong>2</strong> de 4
            </span>
          </div>
        </div>
        <div className="ob-progress">
          <div className="ob-progress__fill" style={{ width: "50%" }} />
        </div>
      </header>

      <div className="ob-body">
        <OnboardingForm2 />
      </div>
    </div>
  );
}
