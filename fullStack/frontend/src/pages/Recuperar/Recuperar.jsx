import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import logo from "../../assets/fitpocketlogo(inverted).png";
import "./Recuperar.css";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Paso 1 de la recuperación: pedir el enlace por mail.
export default function Recuperar() {
  const { t, i18n } = useTranslation();
  const [email,   setEmail]   = useState("");
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [enviado, setEnviado] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const limpio = email.trim();
    if (!EMAIL_REGEX.test(limpio)) { setError(t("recuperar.errorEmail")); return; }
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/forgot-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ email: limpio, idioma: i18n.language }),
      });
      if (res.status === 400) { setError(t("recuperar.errorEmail")); return; }
      if (!res.ok) throw new Error();
      setEnviado(true);
    } catch {
      setError(t("recuperar.errorConexion"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rec-page">
      <div className="rec-card">
        <Link to="/" className="rec-brand">
          <img src={logo} alt="" className="rec-brand__img" />
          <span className="rec-brand__text">FitPocket</span>
        </Link>

        {enviado ? (
          <div role="status">
            <h1 className="rec-title">{t("recuperar.enviadoTitulo")}</h1>
            <p className="rec-text">{t("recuperar.enviadoTexto", { email: email.trim() })}</p>
            <p className="rec-hint">{t("recuperar.enviadoAyuda")}</p>
            <Link to="/login" className="rec-btn rec-btn--ghost">{t("recuperar.volverLogin")}</Link>
          </div>
        ) : (
          <>
            <h1 className="rec-title">{t("recuperar.titulo")}</h1>
            <p className="rec-text">{t("recuperar.subtitulo")}</p>

            <form className="rec-form" onSubmit={handleSubmit} noValidate>
              <div className="rec-field">
                <label className="rec-label" htmlFor="rec-email">{t("recuperar.email")}</label>
                <input
                  id="rec-email"
                  type="email"
                  className="rec-input"
                  autoComplete="email"
                  placeholder={t("recuperar.placeholderEmail")}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              {error && <p className="rec-error" role="alert">{error}</p>}

              <button type="submit" className="rec-btn" disabled={loading}>
                {loading ? t("recuperar.enviando") : t("recuperar.enviar")}
              </button>
            </form>

            <Link to="/login" className="rec-link">{t("recuperar.volverLogin")}</Link>
          </>
        )}
      </div>
    </div>
  );
}
