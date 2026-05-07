import "./Guest.css";
import IMCCalculator from "../../components/IMCCalculator/IMCCalculator";

function Guest() {
  return (
    <div className="guest-container">
      <header className="guest-header">
        <h1 className="title">FitPocket</h1>
        <h2 className="subtitle">Coaching con IA</h2>
        <p className="description">
          Tu entrenador personal inteligente. Plan de rutina y alimentación
          generado por IA según tus datos, objetivos y presupuesto.
        </p>
        <button className="cta">Crear cuenta</button>
      </header>

      <section className="guest-section">
        <h3>Calculá tu IMC sin cuenta</h3>
        <IMCCalculator />
      </section>

      <section className="guest-section">
        <h3>Rutina semanal</h3>
        <p>Datos adaptados a tu nivel, horarios y limitaciones físicas.</p>
      </section>

      <section className="guest-section">
        <h3>Alimentación</h3>
        <p>Menú diario con calorías y costo ajustado a tu presupuesto mensual.</p>
      </section>

      <section className="guest-section">
        <h3>Seguimiento</h3>
        <p>
          Checklist diario. El plan se regenera si tu adherencia cae del 50%.
        </p>
      </section>

      <footer className="guest-footer">
        <button className="cta">Registrarse</button>
      </footer>
    </div>
  );
}

export default Guest;
