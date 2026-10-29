import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import { normalize } from "../../lib/utils";
import usePermisos from "../../hooks/usePermisos";
import DialogoConfirmacion from "./DialogoConfirmacion";

/* ── Icons ── */
const IconSearch = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <circle cx="11" cy="11" r="7" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
);

// Listado de usuarios: la carga la hace Admin (la comparte con la pestaña de familias)
export default function UsuariosTab({ users, setUsers, loading, error, onReintentar, isPreview }) {
  const navigate    = useNavigate();
  const { t, i18n } = useTranslation();
  const { tiene }   = usePermisos();

  const [busqueda,     setBusqueda]     = useState("");
  const [aBorrar,      setABorrar]      = useState(null);
  const [borrando,     setBorrando]     = useState(false);
  const [errorBorrado, setErrorBorrado] = useState(false);
  const [aviso,        setAviso]        = useState("");
  const buscadorRef = useRef(null);
  const origenRef   = useRef(null); // botón que abrió el diálogo, para devolverle el foco

  const puedeBorrar = tiene("usuarios.borrar");

  const fmtFecha = useMemo(
    () => new Intl.DateTimeFormat(i18n.language === "en" ? "en-US" : "es-AR", {
      day: "2-digit", month: "2-digit", year: "numeric",
    }),
    [i18n.language],
  );

  const filtrados = useMemo(() => {
    const q = normalize(busqueda.trim());
    if (!q) return users;
    return users.filter(u => normalize(u.nombre ?? "").includes(q) || normalize(u.email).includes(q));
  }, [users, busqueda]);

  const abrirBorrado = (usuario, e) => {
    origenRef.current = e.currentTarget;
    setErrorBorrado(false);
    setAviso("");
    setABorrar(usuario);
  };

  const cancelarBorrado = () => {
    setABorrar(null);
    origenRef.current?.focus();
  };

  const confirmarBorrado = async () => {
    setBorrando(true);
    setErrorBorrado(false);
    try {
      if (!isPreview) {
        const res = await fetch(`${API_URL}/users/${aBorrar._id}`, {
          method:  "DELETE",
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (res.status === 401) {
          localStorage.removeItem("token");
          navigate("/login", { replace: true });
          return;
        }
        // 404: otro admin ya la borró. Para esta pantalla es lo mismo que haberla borrado.
        if (!res.ok && res.status !== 404) { setErrorBorrado(true); return; }
      }
      setUsers(us => us.filter(u => u._id !== aBorrar._id));
      setAviso(t("admin.borrado", { email: aBorrar.email }));
      setABorrar(null);
      buscadorRef.current?.focus(); // la fila ya no existe: el foco va al buscador
    } catch {
      setErrorBorrado(true);
    } finally {
      setBorrando(false);
    }
  };

  const hayBusqueda = busqueda.trim() !== "";

  return (
    <>
      <header className="ad-header">
        <h2 className="ad-subtitle">{t("admin.titulo")}</h2>
        {!loading && !error && (
          <p className="ad-count" aria-live="polite">
            {hayBusqueda
              ? t("admin.filtrados", { n: filtrados.length, total: users.length })
              : t("admin.total", { count: users.length })}
          </p>
        )}
      </header>

      <div className="ad-search">
        <label className="ad-search__label" htmlFor="ad-buscar">{t("admin.buscarLabel")}</label>
        <div className="ad-search__wrap">
          <IconSearch />
          <input
            id="ad-buscar"
            ref={buscadorRef}
            type="search"
            className="ad-search__input"
            placeholder={t("admin.buscarPlaceholder")}
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            autoComplete="off"
            disabled={loading || error}
          />
        </div>
      </div>

      <p className="ad-aviso" role="status" aria-live="polite">{aviso}</p>

      {loading && (
        <div className="ad-skeleton" role="status" aria-busy="true" aria-label={t("comun.cargando")}>
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="ad-sk" />)}
        </div>
      )}

      {!loading && error && (
        <div className="ad-error" role="alert">
          <p>{t("admin.errorConexion")}</p>
          <button type="button" className="ad-btn" onClick={onReintentar}>{t("admin.reintentar")}</button>
        </div>
      )}

      {!loading && !error && users.length === 0 && (
        <p className="ad-empty">{t("admin.vacio")}</p>
      )}

      {!loading && !error && users.length > 0 && filtrados.length === 0 && (
        <div className="ad-empty">
          <p>{t("admin.sinResultados", { q: busqueda.trim() })}</p>
          <button type="button" className="ad-btn" onClick={() => { setBusqueda(""); buscadorRef.current?.focus(); }}>
            {t("admin.limpiar")}
          </button>
        </div>
      )}

      {!loading && !error && filtrados.length > 0 && (
        <div className="ad-table-wrap">
          {/* roles explícitos: en mobile las celdas son display:block y sin esto se pierde la semántica de tabla */}
          <table className="ad-table" role="table">
            <caption className="ad-sr-only">{t("admin.titulo")}</caption>
            <thead role="rowgroup">
              <tr role="row">
                <th scope="col" role="columnheader">{t("admin.col.nombre")}</th>
                <th scope="col" role="columnheader">{t("admin.col.email")}</th>
                <th scope="col" role="columnheader">{t("admin.col.rol")}</th>
                <th scope="col" role="columnheader">{t("admin.col.alta")}</th>
                <th scope="col" role="columnheader">{t("admin.col.onboarding")}</th>
                <th scope="col" role="columnheader"><span className="ad-sr-only">{t("admin.col.acciones")}</span></th>
              </tr>
            </thead>
            <tbody role="rowgroup">
              {filtrados.map(u => (
                <tr key={u._id} role="row">
                  <th scope="row" role="rowheader" className="ad-cell-nombre" data-label={t("admin.col.nombre")}>
                    {/* nombre null: el backend no pudo descifrarlo (cuenta creada con otra clave) */}
                    <span className={`ad-valor${u.nombre ? "" : " ad-valor--falta"}`}>
                      {u.nombre ?? t("admin.sinNombre")}
                    </span>
                  </th>
                  <td role="cell" className="ad-cell-email" data-label={t("admin.col.email")}>
                    <span className="ad-valor">{u.email}</span>
                  </td>
                  <td role="cell" data-label={t("admin.col.rol")}>
                    <span className={`ad-badge${u.rol === "admin" ? " ad-badge--admin" : ""}`}>
                      {t(u.rol === "admin" ? "admin.rol.admin" : "admin.rol.usuario")}
                    </span>
                  </td>
                  <td role="cell" className="ad-cell-fecha" data-label={t("admin.col.alta")}>
                    {u.createdAt ? fmtFecha.format(new Date(u.createdAt)) : "—"}
                  </td>
                  <td role="cell" data-label={t("admin.col.onboarding")}>
                    <span className={`ad-estado${u.onboardingCompleto ? " ad-estado--ok" : ""}`}>
                      {t(u.onboardingCompleto ? "admin.onboarding.completo" : "admin.onboarding.pendiente")}
                    </span>
                  </td>
                  <td role="cell" className="ad-cell-acciones">
                    {puedeBorrar && u.rol !== "admin" && (
                      <button
                        type="button"
                        className="ad-btn ad-btn--borrar"
                        onClick={(e) => abrirBorrado(u, e)}
                        aria-label={t("admin.borrarA", { email: u.email })}
                      >
                        <IconTrash /> <span>{t("admin.borrar")}</span>
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {aBorrar && (
        <DialogoConfirmacion
          titulo={t("admin.confirmarTitulo")}
          texto={t("admin.confirmarTexto")}
          error={errorBorrado ? t("admin.errorBorrado") : ""}
          ocupado={borrando}
          textoConfirmar={t("admin.borrarDefinitivo")}
          textoOcupado={t("admin.borrando")}
          peligro
          onCancel={cancelarBorrado}
          onConfirm={confirmarBorrado}
        >
          <p className="ad-dialog__user">
            {aBorrar.nombre && <span className="ad-dialog__user-nombre">{aBorrar.nombre}</span>}
            <span className="ad-dialog__user-email">{aBorrar.email}</span>
          </p>
        </DialogoConfirmacion>
      )}
    </>
  );
}
