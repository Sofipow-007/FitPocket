import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import logo from "../../assets/fitpocketlogo(inverted).png";
import { API_URL } from "../../lib/api";
import { MOCK_USUARIOS } from "../../mocks/adminMock";
import usePermisos from "../../hooks/usePermisos";
import UsuariosTab from "./UsuariosTab";
import FamiliasTab from "./FamiliasTab";
import IntegridadTab from "./IntegridadTab";
import BitacoraTab from "./BitacoraTab";
import BackupTab from "./BackupTab";
import "./Admin.css";

const IconBack = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
  </svg>
);

const IconAyuda = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="12" cy="12" r="10" /><path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 3-3 3" /><line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

// Cada pestaña se muestra solo si el usuario tiene su patente
const TABS = [
  { id: "usuarios", patente: "usuarios.listar" },
  { id: "familias", patente: "familias.gestionar" },
  { id: "integridad", patente: "integridad.verificar" },
  { id: "bitacora", patente: "bitacora.ver" },
  { id: "backup", patente: "backup.ejecutar" },
];

export default function Admin() {
  const navigate        = useNavigate();
  const { t, i18n }     = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const isPreview       = import.meta.env.DEV && searchParams.get("preview") === "true";
  const { tiene, cargando: cargandoPermisos } = usePermisos();

  const visibles = TABS.filter(tab => tiene(tab.patente));
  const pedida   = searchParams.get("tab");
  const activa   = visibles.find(tab => tab.id === pedida)?.id ?? visibles[0]?.id;
  const puedeListar = tiene("usuarios.listar");

  const [loading, setLoading] = useState(!isPreview);
  const [users,   setUsers]   = useState(isPreview ? MOCK_USUARIOS : []);
  const [error,   setError]   = useState(false);
  const [intento, setIntento] = useState(0);
  const tabsRef = useRef(null);

  // Sin ninguna patente de administración no hay nada que ver acá
  useEffect(() => {
    if (!cargandoPermisos && visibles.length === 0) navigate("/dashboard", { replace: true });
  }, [cargandoPermisos, visibles.length, navigate]);

  useEffect(() => {
    if (isPreview || cargandoPermisos) return;
    if (!puedeListar) return;
    const token = localStorage.getItem("token");
    if (!token) { navigate("/login", { replace: true }); return; }
    fetch(`${API_URL}/users/todos`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return Promise.reject();
        }
        if (r.status === 403) { // le quitaron la patente después de cargar la página
          navigate("/dashboard", { replace: true });
          return Promise.reject();
        }
        return r.ok ? r.json() : Promise.reject();
      })
      .then(data => setUsers(data.users ?? []))
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [navigate, isPreview, intento, cargandoPermisos, puedeListar]);

  // Sin usuarios.listar no se piden usuarios: no hay nada que esperar
  const cargandoUsers = puedeListar && loading;

  // En mobile la barra de pestañas se desplaza de costado: la activa tiene que quedar a la vista
  useEffect(() => {
    tabsRef.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [activa]);

  const reintentar = () => {
    setError(false);
    setLoading(true);
    setIntento(n => n + 1);
  };

  const elegirTab = (id) => {
    const params = new URLSearchParams(searchParams);
    params.set("tab", id);
    setSearchParams(params, { replace: true });
  };

  // Patrón de pestañas WAI-ARIA: flechas mueven entre pestañas, Inicio/Fin van a los extremos
  const onTabKey = (e) => {
    const idx = visibles.findIndex(tab => tab.id === activa);
    let nuevo = null;
    if (e.key === "ArrowRight") nuevo = (idx + 1) % visibles.length;
    else if (e.key === "ArrowLeft") nuevo = (idx - 1 + visibles.length) % visibles.length;
    else if (e.key === "Home") nuevo = 0;
    else if (e.key === "End") nuevo = visibles.length - 1;
    if (nuevo === null) return;
    e.preventDefault();
    elegirTab(visibles[nuevo].id);
    tabsRef.current?.querySelectorAll('[role="tab"]')[nuevo]?.focus();
  };

  return (
    <div className="ad-page">
      <nav className="ad-nav">
        <button
          className="ad-nav__back"
          onClick={() => navigate(isPreview ? "/dashboard?preview=true" : "/dashboard")}
          aria-label={t("plan.volver")}
        >
          <IconBack /> <span>{t("plan.volver")}</span>
        </button>
        <div className="ad-nav__brand">
          <img src={logo} alt="" className="ad-nav__logo" />
          <span className="ad-nav__brand-text">FitPocket</span>
        </div>
        <div className="ad-nav__right">
        <Link to="/ayuda" className="ad-nav__ayuda" aria-label={t("ayuda.link")} title={t("ayuda.link")}>
          <IconAyuda />
        </Link>
        <div className="ad-lang" role="group" aria-label={t("comun.idioma")}>
          <button
            className={`ad-lang__btn${i18n.language === "es" ? " ad-lang__btn--on" : ""}`}
            onClick={() => { i18n.changeLanguage("es"); localStorage.setItem("idioma", "es"); }}
          >ES</button>
          <button
            className={`ad-lang__btn${i18n.language === "en" ? " ad-lang__btn--on" : ""}`}
            onClick={() => { i18n.changeLanguage("en"); localStorage.setItem("idioma", "en"); }}
          >EN</button>
        </div>
        </div>
      </nav>

      <main className="ad-main">
        <h1 className="ad-title">{t("admin.panel")}</h1>

        {visibles.length > 0 && (
          <div className="ad-tabs" role="tablist" aria-label={t("admin.panel")} ref={tabsRef} onKeyDown={onTabKey}>
            {visibles.map(tab => (
              <button
                key={tab.id}
                type="button"
                role="tab"
                id={`ad-tab-${tab.id}`}
                aria-selected={activa === tab.id}
                aria-controls={`ad-panel-${tab.id}`}
                tabIndex={activa === tab.id ? 0 : -1}
                className={`ad-tab${activa === tab.id ? " ad-tab--on" : ""}`}
                onClick={() => elegirTab(tab.id)}
              >
                {t(`admin.tabs.${tab.id}`)}
              </button>
            ))}
          </div>
        )}

        {activa && (
          <section role="tabpanel" id={`ad-panel-${activa}`} aria-labelledby={`ad-tab-${activa}`} className="ad-panel">
            {activa === "usuarios" && (
              <UsuariosTab
                users={users}
                setUsers={setUsers}
                loading={cargandoUsers}
                error={error}
                onReintentar={reintentar}
                isPreview={isPreview}
              />
            )}
            {activa === "familias" && (
              <FamiliasTab users={users} setUsers={setUsers} cargandoUsers={cargandoUsers} isPreview={isPreview} />
            )}
            {activa === "integridad" && <IntegridadTab isPreview={isPreview} />}
            {activa === "bitacora" && <BitacoraTab isPreview={isPreview} />}
            {activa === "backup" && <BackupTab isPreview={isPreview} />}
          </section>
        )}
      </main>
    </div>
  );
}
