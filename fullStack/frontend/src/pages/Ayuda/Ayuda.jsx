import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/fitpocketlogo(inverted).png";
import usePermisos from "../../hooks/usePermisos";
import "./Ayuda.css";

const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

// Preguntas frecuentes. Es pública a propósito: la recuperación de contraseña
// y "qué datos se guardan" le sirven también a quien todavía no entró.
export default function Ayuda() {
  const navigate     = useNavigate();
  const { hash }     = useLocation();
  const { t }        = useTranslation();
  const { tiene }    = usePermisos();
  const conSesion    = Boolean(localStorage.getItem("token"));

  const secciones = t("ayuda.secciones", { returnObjects: true });
  const admin     = t("ayuda.admin", { returnObjects: true });
  const esAdmin   = tiene("usuarios.listar");

  // /ayuda#adherencia (desde un "?") abre esa pregunta y la lleva a la vista
  useEffect(() => {
    const id = decodeURIComponent(hash.replace("#", ""));
    if (!id) return;
    const pregunta = document.getElementById(id);
    if (!pregunta) return;
    pregunta.open = true;
    pregunta.scrollIntoView({ block: "start" });
    pregunta.querySelector("summary")?.focus({ preventScroll: true });
  }, [hash, esAdmin]);

  // Volver a donde estaba; si entró directo por el link, al inicio que le corresponde
  const volver = () => {
    if (window.history.state?.idx > 0) navigate(-1);
    else navigate(conSesion ? "/dashboard" : "/");
  };

  const renderSeccion = (seccion) => (
    <section key={seccion.id} className="ay-seccion" aria-labelledby={`ay-sec-${seccion.id}`}>
      <h2 className="ay-seccion__titulo" id={`ay-sec-${seccion.id}`}>{seccion.titulo}</h2>
      <div className="ay-preguntas">
        {seccion.preguntas.map(p => (
          <details key={p.id} id={p.id} className="ay-pregunta">
            <summary className="ay-pregunta__p">{p.p}</summary>
            <div className="ay-pregunta__r">
              {p.r.map((parrafo, i) => <p key={i}>{parrafo}</p>)}
            </div>
          </details>
        ))}
      </div>
    </section>
  );

  return (
    <div className="ay-page">
      <nav className="ay-nav">
        <button className="ay-nav__back" onClick={volver} aria-label={t("ayuda.volver")}>
          <IconBack /> <span>{t("ayuda.volver")}</span>
        </button>
        <div className="ay-nav__brand">
          <img src={logo} alt="" className="ay-nav__logo" />
          <span className="ay-nav__brand-text">FitPocket</span>
        </div>
        <span />
      </nav>

      <main className="ay-main">
        <header className="ay-header">
          <h1 className="ay-title">{t("ayuda.titulo")}</h1>
          <p className="ay-intro">{t("ayuda.intro")}</p>
        </header>

        {Array.isArray(secciones) && secciones.map(renderSeccion)}
        {esAdmin && admin?.preguntas && renderSeccion(admin)}
      </main>
    </div>
  );
}
