import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";

/**
 * AuthModal
 * Modal de login que aparece sobre la home invitada.
 * Props:
 *   isOpen: boolean
 *   onClose: () => void
 */
export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const overlayRef = useRef(null);

  // Cerrar con ESC
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg || "Email o contraseña incorrectos");
        return;
      }

      localStorage.setItem("token", data.token);
      onClose();
      navigate("/dashboard"); // ajustar cuando exista la ruta
    } catch (err) {
      setError("Error de conexión. Intentá más tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`auth-modal-overlay ${isOpen ? "auth-modal-overlay--open" : ""}`}
      ref={overlayRef}
      onClick={handleOverlayClick}
    >
      <div className="auth-modal">

        {/* Botón cerrar */}
        <button className="auth-modal__close" onClick={onClose} aria-label="Cerrar">
          ✕
        </button>

        {/* Logo */}
        <div className="auth-modal__logo">
          <span className="auth-modal__logo-dot" />
          <span className="auth-modal__logo-text">FitPlan AI</span>
        </div>

        <h2 className="auth-modal__title">Bienvenido de vuelta</h2>
        <p className="auth-modal__subtitle">Ingresá a tu cuenta para continuar</p>

        <form className="auth-modal__form" onSubmit={handleSubmit}>

          <div className="auth-modal__field">
            <label className="auth-modal__label">Email</label>
            <input
              type="email"
              className="auth-modal__input"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <div className="auth-modal__field">
            <label className="auth-modal__label">Contraseña</label>
            <div className="auth-modal__password-wrap">
              <input
                type={showPassword ? "text" : "password"}
                className="auth-modal__input"
                placeholder="Tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-modal__eye"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? "○" : "●"}
              </button>
            </div>
          </div>

          {error && (
            <div className="auth-modal__error">{error}</div>
          )}

          <button
            type="submit"
            className="auth-modal__btn"
            disabled={loading}
          >
            {loading ? "Ingresando..." : "Ingresar →"}
          </button>

        </form>

        <div className="auth-modal__footer">
          <span>¿No tenés cuenta?</span>
          <button
            type="button"
            className="auth-modal__link"
            onClick={() => { onClose(); navigate("/register"); }}
          >
            Registrarse
          </button>
        </div>

      </div>
    </div>
  );
}
