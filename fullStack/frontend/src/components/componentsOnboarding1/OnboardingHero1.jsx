import Navbar from "../NavBar/Navbar";
import StepsIndicator from "../StepsIndicator/StepsIndicator";
import "./OnboardingHero1.css";

export default function OnboardingHero1() {
  return (
    <header className="onboarding-hero1">
      <div className="navbar-wrapper">
        <Navbar />
        <h2 className="step-title">Paso 1 de 4 - Tu cuerpo</h2>
      </div>
      <StepsIndicator currentStep={1} />
    </header>
  );
}
