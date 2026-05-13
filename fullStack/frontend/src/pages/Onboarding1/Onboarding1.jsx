import "./Onboarding1.css";
import OnboardingHero1 from "../../components/componentsOnboarding1/OnboardingHero1";
import OnboardingForm1 from "../../components/componentsOnboarding1/OnboardingForm1";
import OnboardingInfo1 from "../../components/componentsOnboarding1/OnboardingInfo1";

export default function Onboarding1() {
  return (
    <div className="onboarding1-container">
      <OnboardingHero1 />
      <div className="onboarding1-content">
        <section className="onboarding1-info">
          <OnboardingInfo1 />
        </section>
        <section className="onboarding1-form">
          <OnboardingForm1 />
        </section>
      </div>
    </div>
  );
}
