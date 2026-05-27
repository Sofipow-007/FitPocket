import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./RegisterFormNew.css";

function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 8)  score++;
  if (pwd.length >= 12) score++;
  if (/[A-Z]/.test(pwd)) score++;
  if (/[0-9]/.test(pwd)) score++;
  if (/[^A-Za-z0-9]/.test(pwd)) score++;

  if (score <= 1) return { score: 1, label: "Muy débil", color: "var(--err)" };
  if (score === 2) return { score: 2, label: "Débil",    color: "#e07a52" };
  if (score === 3) return { score: 3, label: "Media",    color: "var(--warn)" };
  if (score === 4) return { score: 4, label: "Fuerte",   color: "var(--vio2)" };
  return               { score: 5, label: "Muy fuerte", color: "var(--ok)" };
}

export default function RegisterFormNew({ onLoginClick }) {
  const navigate = useNavigate();
  const [nombre,       setNombre]       = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  const strength = getStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre, email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Error en el registro");
        return;
      }

      localStorage.setItem("token", data.token);
      navigate("/onboarding");
    } catch (err) {
      setError("Error de conexión. Intentá más tarde.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="reg-form">

      <div className="reg-form__header">
        <h1 className="reg-form__title">Crear cuenta</h1>
        <p className="reg-form__subtitle">Empezá gratis. Sin tarjeta de crédito.</p>
      </div>

      <form className="reg-form__fields" onSubmit={handleSubmit}>

        <div className="reg-form__field">
          <label className="reg-form__label">Nombre</label>
          <input
            type="text"
            className="reg-form__input"
            placeholder="Tu nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
            autoFocus
          />
        </div>

        <div className="reg-form__field">
          <label className="reg-form__label">Email</label>
          <input
            type="email"
            className="reg-form__input"
            placeholder="tu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="reg-form__field">
          <label className="reg-form__label">Contraseña</label>
          <div className="reg-form__password-wrap">
            <input
              type={showPassword ? "text" : "password"}
              className="reg-form__input"
              placeholder="Mínimo 8 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="reg-form__eye"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? "○" : "●"}
            </button>
          </div>

          {/* Barra de fortaleza */}
          {password && (
            <div className="reg-form__strength">
              <div className="reg-form__strength-bars">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="reg-form__strength-bar"
                    style={{
                      background: i <= strength.score ? strength.color : "var(--bg4)",
                      transition: `background 0.3s ease ${i * 0.05}s`,
                    }}
                  />
                ))}
              </div>
              <span
                className="reg-form__strength-label"
                style={{ color: strength.color }}
              >
                {strength.label}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="reg-form__error">{error}</div>
        )}

        <button
          type="submit"
          className="reg-form__btn"
          disabled={loading}
        >
          {loading ? "Creando cuenta..." : "Crear cuenta y continuar →"}
        </button>

      </form>

      <p className="reg-form__terms">
        Al registrarte aceptás los{" "}
        <button type="button" className="reg-form__terms-link">términos de uso</button>
      </p>

      <div className="reg-form__login">
        <span>¿Ya tenés cuenta?</span>
        <button
          type="button"
          className="reg-form__login-link"
          onClick={onLoginClick}
        >
          Iniciá sesión
        </button>
      </div>

    </div>
  );
}
