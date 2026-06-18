import "./LoginForm.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

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
      const res = await fetch("http://localhost:3000/auth/login", {
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
      <h2>{t("login.titulo")}</h2>
      <p>{t("login.subtitulo")}</p>
      <form onSubmit={handleSubmit}>
        <label>{t("login.email")}</label>
        <input
          type="email"
          placeholder={t("login.email")}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>{t("login.password")}</label>
        <input
          type="password"
          placeholder={t("login.password")}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {error && <p className="login-error" role="alert">{error}</p>}

        <a href="#" className="forgot-password">{t("login.olvidaste")}</a>
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? t("login.ingresando") : t("login.ingresar")}
        </button>
      </form>
    </div>
  );
}
