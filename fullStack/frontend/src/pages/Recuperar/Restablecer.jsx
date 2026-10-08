import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import logo from "../../assets/fitpocketlogo(inverted).png";
import "./Recuperar.css";

// Paso 2 de la recuperación: elegir la contraseña nueva con el enlace del mail.
export default function Restablecer() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const token = params.get("token") || "";

  const [password,  setPassword]  = useState("");
  const [repetida,  setRepetida]  = useState("");
  const [mostrar,   setMostrar]   = useState(false);
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [invalido,  setInvalido]  = useState(!token);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8)   { setError(t("restablecer.errorCorta")); return; }
    if (password !== repetida) { setError(t("restablecer.errorDistintas")); return; }
    setError("");
    setLoading(true);
    try {
      const res  = await fetch(`${API_URL}/auth/reset-password`, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ token, password }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.status === 400 && data.codigo === "ENLACE_INVALIDO") { setInvalido(true); return; }
      if (res.status === 400) { setError(t("restablecer.errorCorta")); return; }
      if (!res.ok || !data.token) throw new Error();
      // la sesión anterior (si había) ya no sirve: se reemplaza por la nueva
      localStorage.setItem("token", data.token);
      navigate("/dashboard", { replace: true });
    } catch {
      setError(t("restablecer.errorConexion"));
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

        {invalido ? (
          <div role="alert">
            <h1 className="rec-title">{t("restablecer.invalidoTitulo")}</h1>
            <p className="rec-text">{t("restablecer.invalidoTexto")}</p>
            <Link to="/recuperar" className="rec-btn">{t("restablecer.pedirOtro")}</Link>
          </div>
        ) : (
          <>
            <h1 className="rec-title">{t("restablecer.titulo")}</h1>
            <p className="rec-text">{t("restablecer.subtitulo")}</p>

            <form className="rec-form" onSubmit={handleSubmit} noValidate>
              <div className="rec-field">
                <label className="rec-label" htmlFor="res-password">{t("restablecer.nueva")}</label>
                <input
                  id="res-password"
                  type={mostrar ? "text" : "password"}
                  className="rec-input"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  aria-describedby="res-ayuda"
                  autoFocus
                />
                <span id="res-ayuda" className="rec-hint">{t("restablecer.ayuda")}</span>
              </div>

              <div className="rec-field">
                <label className="rec-label" htmlFor="res-repetida">{t("restablecer.repetir")}</label>
                <input
                  id="res-repetida"
                  type={mostrar ? "text" : "password"}
                  className="rec-input"
                  autoComplete="new-password"
                  value={repetida}
                  onChange={(e) => setRepetida(e.target.value)}
                />
              </div>

              <label className="rec-check">
                <input type="checkbox" checked={mostrar} onChange={(e) => setMostrar(e.target.checked)} />
                <span>{t("restablecer.mostrar")}</span>
              </label>

              {error && <p className="rec-error" role="alert">{error}</p>}

              <button type="submit" className="rec-btn" disabled={loading}>
                {loading ? t("restablecer.guardando") : t("restablecer.guardar")}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
