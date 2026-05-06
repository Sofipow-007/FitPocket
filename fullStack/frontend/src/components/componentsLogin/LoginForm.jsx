import "./LoginForm.css";

export default function LoginForm() {
  return (
    <div className="login-form">
      <h2>Bienvenido de vuelta</h2>
      <p>Ingresá para continuar con tu plan activo</p>
      <form>
        <input type="email" placeholder="Email" />
        <input type="password" placeholder="Contraseña" />
        <a href="#" className="forgot-password">¿Olvidaste tu contraseña?</a>
        <button type="submit" className="btn btn-primary">Iniciar sesión</button>
      </form>
    </div>
  );
}
