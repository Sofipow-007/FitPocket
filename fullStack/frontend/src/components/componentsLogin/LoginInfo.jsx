import "./LoginInfo.css";

export default function LoginInfo() {
  return (
    <div className="login-info">
      <h2>LO QUE TE ESPERA</h2>
      <ul>
        <li>
          <span className="bullet">✔</span>
          <div>
            <strong>Plan de dieta personalizado</strong>
            Rutina y dieta generadas en segundos
          </div>
        </li>
        <li>
          <span className="bullet">✔</span>
          <div>
            <strong>Entrenamientos adaptados</strong>
            Ejercicios según tu nivel y objetivo
          </div>
        </li>
        <li>
          <span className="bullet">✔</span>
          <div>
            <strong>Seguimiento constante</strong>
            Estadísticas y progreso en tiempo real
          </div>
        </li>
      </ul>
    </div>
  );
}
