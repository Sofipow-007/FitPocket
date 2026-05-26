import StepIndicator from "../StepIndicator/StepIndicator";
import OnboardingInfo1 from "../componentsOnboarding1/OnboardingInfo1";
import logo from "../../assets/fitpocketlogo(inverted).png";
import "./OnboardingHero2.css";
import { useNavigate } from "react-router-dom";

export default function OnboardingHero2() {
  const navigate = useNavigate();
  return (
    <aside className="ob2-panel">

      <button className="ob2-panel__logo" onClick={() => navigate("/")}>
        <img src={logo} alt="FitPocket" className="ob2-panel__logo-img" />
        <span className="ob2-panel__logo-text">FitPlan AI</span>
      </button>

      <div className="ob2-panel__stepper">
        <StepIndicator currentStep={2} />
      </div>

      <div className="ob2-panel__info">
        <OnboardingInfo1 />
      </div>

    </aside>
  );
}
