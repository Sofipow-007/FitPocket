import "./Onboarding1.css";
import OnboardingPanel1 from "../../components/componentsOnboarding1/OnboardingHero1";
import OnboardingForm1 from "../../components/componentsOnboarding1/OnboardingForm1";

export default function Onboarding1() {
  return (
    <div className="ob1-layout">
      {/* Panel izquierdo: logo + stepper + info */}
      <OnboardingPanel1 />
      {/* Panel derecho: formulario */}
      <main className="ob1-main">
        <OnboardingForm1 />
      </main>
    </div>
  );
}
