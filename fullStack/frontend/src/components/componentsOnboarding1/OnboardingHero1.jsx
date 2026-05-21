import Navbar from "../NavBar/Navbar";
import StepIndicator from "../StepIndicator/StepIndicator";
import "./OnboardingHero1.css";

import "./OnboardingHero1.css";

export default function OnboardingHero1() {
  return (
    <header className="onboarding-hero1">
      <Navbar />
      <h2 className="step-title">Paso 1 de 4 - Tu cuerpo</h2>
      <StepIndicator currentStep={1} />
    </header>
  );
}
