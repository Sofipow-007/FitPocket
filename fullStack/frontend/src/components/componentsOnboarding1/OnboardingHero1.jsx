import StepIndicator from "../StepIndicator/StepIndicator";
import OnboardingInfo1 from "./OnboardingInfo1";
import logo from '../../assets/fitpocketlogo(inverted).png';
import "./OnboardingHero1.css";
import { useNavigate } from "react-router-dom";

export default function OnboardingHero1() {
  const navigate = useNavigate(); 
  return (
    <aside className="ob-panel">

      {/* Logo */}
      <button className="ob-panel__logo" onClick={() => navigate("/")}>
        <img src={logo} alt="FitPocket" className="ob-panel__logo-img" />
        <span className="ob-panel__logo-text">FitPlan AI</span>
      </button>

      {/* Stepper vertical */}
      <div className="ob-panel__stepper">
        <StepIndicator currentStep={1} />
      </div>

      {/* Info motivacional */}
      <div className="ob-panel__info">
        <OnboardingInfo1 />
      </div>

    </aside>
  );
}
