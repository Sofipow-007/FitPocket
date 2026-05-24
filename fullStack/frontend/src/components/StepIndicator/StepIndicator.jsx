import "./StepIndicator.css";

const STEP_NAMES = ["Tu cuerpo", "Tu objetivo", "Tu estilo", "Limitaciones"];

export default function StepIndicator({ currentStep }) {
  return (
    <nav className="step-indicator" aria-label="Progreso del onboarding">
      {STEP_NAMES.map((name, index) => {
        const stepNum = index + 1;
        const isDone = stepNum < currentStep;
        const isActive = stepNum === currentStep;

        return (
          <div key={stepNum} className="step-indicator__item">

            {/* Línea conectora arriba (excepto primer paso) */}
            {index > 0 && (
              <div className={`step-indicator__line ${isDone || isActive ? "step-indicator__line--done" : ""}`} />
            )}

            <div className="step-indicator__row">
              {/* Círculo */}
              <div className={`step-indicator__circle
                ${isDone ? "step-indicator__circle--done" : ""}
                ${isActive ? "step-indicator__circle--active" : ""}
                ${!isDone && !isActive ? "step-indicator__circle--pending" : ""}
              `}>
                {isDone ? (
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : (
                  <span>{stepNum}</span>
                )}
              </div>

              {/* Nombre del paso */}
              <span className={`step-indicator__name
                ${isActive ? "step-indicator__name--active" : ""}
                ${isDone ? "step-indicator__name--done" : ""}
              `}>
                {name}
              </span>
            </div>

          </div>
        );
      })}
    </nav>
  );
}
