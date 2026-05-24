import StepIndicator from "../StepIndicator/StepIndicator";
import OnboardingInfo1 from "./OnboardingInfo1";
import "./OnboardingHero1.css";

export default function OnboardingHero1() {
  return (
    <aside className="ob-panel">

      {/* Logo */}
      <div className="ob-panel__logo">
        <span className="ob-panel__logo-dot" />
        <span className="ob-panel__logo-text">FitPlan AI</span>
      </div>

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
