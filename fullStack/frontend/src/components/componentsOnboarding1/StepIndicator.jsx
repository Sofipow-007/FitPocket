import "./StepsIndicator.css";

export default function StepsIndicator({ currentStep }) {
  const steps = [1, 2, 3, 4];

  return (
    <div className="steps-indicator">
      {steps.map((step) => (
        <div
          key={step}
          className={`step ${currentStep === step ? "active" : ""}`}
        >
          {step}
        </div>
      ))}
    </div>
  );
}
