import "./Register.css";
import RegisterFormNew from "../../components/componentsRegister/RegisterFormNew";
import logo from "../../assets/fitpocketlogo(inverted).png";
import { useNavigate } from "react-router-dom";

export default function Register() {
  const navigate = useNavigate();

  return (
    <div className="reg-layout">

      {/* Panel izquierdo — decorativo */}
      <aside className="reg-panel">
        <div className="reg-panel__glow" />
        <div className="reg-panel__glow2" />

        <button className="reg-panel__logo" onClick={() => navigate("/")}>
          <img src={logo} alt="FitPocket" className="reg-panel__logo-img" />
          <span className="reg-panel__logo-text">FitPlan AI</span>
        </button>

        <div className="reg-panel__content">
          <p className="reg-panel__eyebrow">Por qué registrarse</p>
          <h2 className="reg-panel__title">
            Tu plan,<br />
            <em>listo en 3 minutos.</em>
          </h2>
          <ul className="reg-panel__list">
            <li>
              <span className="reg-panel__num">01</span>
              <div>
                <strong>Completás el onboarding</strong>
                <p>Datos físicos, objetivo y disponibilidad.</p>
              </div>
            </li>
            <li>
              <span className="reg-panel__num">02</span>
              <div>
                <strong>La IA genera tu plan</strong>
                <p>Rutina + dieta personalizadas en ~15 seg.</p>
              </div>
            </li>
            <li>
              <span className="reg-panel__num">03</span>
              <div>
                <strong>Seguís el checklist</strong>
                <p>El plan se adapta automáticamente.</p>
              </div>
            </li>
          </ul>
        </div>

        <p className="reg-panel__footer">
          Sin tarjeta de crédito · Sin compromisos
        </p>
      </aside>

      {/* Panel derecho — formulario */}
      <main className="reg-main">
        <div className="reg-main__glow" />
        <RegisterFormNew onLoginClick={() => navigate("/login")} />
      </main>

    </div>
  );
}
