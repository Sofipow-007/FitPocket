import "./LoginForm.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";

export default function LoginForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.msg ? t("login.errorCredenciales") : t("login.errorConexion"));
        return;
      }

      localStorage.setItem("token", data.token);
      navigate("/dashboard");
    } catch {
      setError(t("login.errorConexion"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-form">
      <h1>{t("login.titulo")}</h1>
      <p>{t("login.subtitulo")}</p>
      <form onSubmit={handleSubmit}>
        <label htmlFor="login-email">{t("login.email")}</label>
        <input
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="login-password">{t("login.password")}</label>
        <input
          id="login-password"
          type="password"
          autoComplete="current-password"
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t("login.ingresando") : t("login.ingresar")}
        </button>
      </form>
    </div>
  );
}
