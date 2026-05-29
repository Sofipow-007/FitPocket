import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./AuthModal.css";

const IconEyeOpen = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);
const IconEyeClosed = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
    <line x1="1" y1="1" x2="23" y2="23" />
  </svg>
);

export default function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    if (isOpen) document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [isOpen, onClose]);

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
      const res  = await fetch("http://localhost:5000/auth/login", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.msg || "Email o contraseña incorrectos"); return; }
      localStorage.setItem("token", data.token);
      onClose();
      navigate("/dashboard");
    } catch {
      setError("Error de conexión. Intentá más tarde.");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="auth-modal-overlay"
      ref={overlayRef}
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-label="Iniciar sesión"
    >
      <div className="auth-modal">
        <button className="auth-modal__close" onClick={onClose} aria-label="Cerrar">✕</button>

        <div className="auth-modal__logo">
          <span className="auth-modal__logo-dot" />
          <span className="auth-modal__logo-text">FitPocket</span>
        </div>

        <h2 className="auth-modal__title">Bienvenido de vuelta</h2>
        <p className="auth-modal__subtitle">Ingresá a tu cuenta para continuar</p>

        <form className="auth-modal__form" onSubmit={handleSubmit}>
          <div className="auth-modal__field">
            <label className="auth-modal__label" htmlFor="am-email">Email</label>
            <input
              id="am-email"
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
            <label className="auth-modal__label" htmlFor="am-password">Contraseña</label>
            <div className="auth-modal__password-wrap">
              <input
                id="am-password"
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
                onClick={() => setShowPassword(v => !v)}
                aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                tabIndex={-1}
              >
                {showPassword ? <IconEyeClosed /> : <IconEyeOpen />}
              </button>
            </div>
          </div>

          {error && <div className="auth-modal__error" role="alert">{error}</div>}

          <button type="submit" className="auth-modal__btn" disabled={loading}>
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
