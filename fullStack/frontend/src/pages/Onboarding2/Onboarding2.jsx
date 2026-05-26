import "./Onboarding2.css";
import OnboardingHero2 from "../../components/componentsOnboarding2/OnboardingHero2";
import OnboardingForm2 from "../../components/componentsOnboarding2/OnboardingForm2";

export default function Onboarding2() {
  return (
    <div className="ob2-layout">
      <OnboardingHero2 />
      <main className="ob2-main">
        <OnboardingForm2 />
      </main>
    </div>
  );
}
