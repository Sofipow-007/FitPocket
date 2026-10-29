import { useState, useEffect, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import { MOCK_BITACORA, MOCK_ACCIONES } from "../../mocks/adminMock";
import AyudaTip from "../../components/Ayuda/AyudaTip";

const FILTROS_VACIOS = { email: "", accion: "", desde: "", hasta: "", estado: "" };
const POR_PAGINA = 25;

// Color del código HTTP: el texto dice el código, el color solo acompaña
function claseEstado(code) {
  if (code == null) return "ad-code--evento";
  if (code >= 500) return "ad-code--mal";
  if (code >= 400) return "ad-code--aviso";
  return "ad-code--ok";
}

// Bitácora paginada del lado del servidor: los filtros se aplican al enviar el formulario
export default function BitacoraTab({ isPreview }) {
  const navigate    = useNavigate();
  const { t, i18n } = useTranslation();

  const [borrador,  setBorrador]  = useState(FILTROS_VACIOS); // lo que se está escribiendo
  const [filtros,   setFiltros]   = useState(FILTROS_VACIOS); // lo aplicado
  const [pagina,    setPagina]    = useState(1);
  const [datos,     setDatos]     = useState(isPreview ? MOCK_BITACORA : null);
  const [acciones,  setAcciones]  = useState(isPreview ? MOCK_ACCIONES : []);
  const [loading,   setLoading]   = useState(!isPreview);
  const [error,     setError]     = useState(false);
  const [intento,   setIntento]   = useState(0);
  const tablaRef = useRef(null);

  const fmtFecha = useMemo(
    () => new Intl.DateTimeFormat(i18n.language === "en" ? "en-US" : "es-AR", {
      day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
    }),
    [i18n.language],
  );

  const salirSi401 = (r) => {
    if (r.status === 401) {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      throw new Error("401");
    }
    return r;
  };

  useEffect(() => {
    if (isPreview) return;
    fetch(`${API_URL}/bitacora/acciones`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(salirSi401)
      .then(r => (r.ok ? r.json() : { acciones: [] }))
      .then(d => setAcciones(d.acciones ?? []))
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview]);

  useEffect(() => {
    if (isPreview) return;
    let vigente = true;
    const params = new URLSearchParams({ pagina: String(pagina), porPagina: String(POR_PAGINA) });
    for (const [k, v] of Object.entries(filtros)) if (v) params.set(k, v);
    fetch(`${API_URL}/bitacora?${params}`, { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } })
      .then(salirSi401)
      .then(r => (r.ok ? r.json() : Promise.reject()))
      .then(d => { if (vigente) { setDatos(d); setError(false); } })
      .catch(() => { if (vigente) setError(true); })
      .finally(() => { if (vigente) setLoading(false); });
    return () => { vigente = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview, filtros, pagina, intento]);

  const aplicar = (e) => {
    e.preventDefault();
    setLoading(true);
    setPagina(1);
    setFiltros({ ...borrador, email: borrador.email.trim() });
  };

  const limpiar = () => {
    setBorrador(FILTROS_VACIOS);
    if (Object.values(filtros).some(Boolean) || pagina !== 1) {
      setLoading(true);
      setPagina(1);
      setFiltros(FILTROS_VACIOS);
    }
  };

  const irAPagina = (n) => {
    setLoading(true);
    setPagina(n);
    tablaRef.current?.focus();
  };

  const campo = (k) => ({
    value: borrador[k],
    onChange: (e) => setBorrador(b => ({ ...b, [k]: e.target.value })),
  });

  const hayFiltros = Object.values(filtros).some(Boolean);
  const items = datos?.items ?? [];

  return (
    <>
      <header className="ad-header">
        <div>
          <h2 className="ad-subtitle">{t("admin.bitacora.titulo")} <AyudaTip etiqueta={t("ayuda.tips.seccionEtiqueta", { seccion: t("admin.tabs.bitacora") })} texto={t("ayuda.tips.bitacora")} ancla="admin-integridad" lado="izq" /></h2>
          <p className="ad-intro">{t("admin.bitacora.intro", { dias: datos?.ttlDias ?? 180 })}</p>
        </div>
        {datos && !error && (
          <p className="ad-count" aria-live="polite">{t("admin.bitacora.total", { count: datos.total })}</p>
        )}
      </header>

      <form className="ad-filtros" onSubmit={aplicar} aria-label={t("admin.bitacora.filtros")}>
        <div className="ad-field">
          <label htmlFor="bit-email" className="ad-field__label">{t("admin.bitacora.email")}</label>
          <input id="bit-email" type="search" className="ad-input" autoComplete="off" placeholder={t("admin.bitacora.emailPlaceholder")} {...campo("email")} />
        </div>
        <div className="ad-field">
          <label htmlFor="bit-accion" className="ad-field__label">{t("admin.bitacora.accion")}</label>
          <select id="bit-accion" className="ad-input" {...campo("accion")}>
            <option value="">{t("admin.bitacora.todas")}</option>
            {acciones.map(a => <option key={a} value={a}>{a}</option>)}
          </select>
        </div>
        <div className="ad-field">
          <label htmlFor="bit-desde" className="ad-field__label">{t("admin.bitacora.desde")}</label>
          <input id="bit-desde" type="date" className="ad-input" max={borrador.hasta || undefined} {...campo("desde")} />
        </div>
        <div className="ad-field">
          <label htmlFor="bit-hasta" className="ad-field__label">{t("admin.bitacora.hasta")}</label>
          <input id="bit-hasta" type="date" className="ad-input" min={borrador.desde || undefined} {...campo("hasta")} />
        </div>
        <div className="ad-field">
          <label htmlFor="bit-estado" className="ad-field__label">{t("admin.bitacora.estado")}</label>
          <select id="bit-estado" className="ad-input" {...campo("estado")}>
            <option value="">{t("admin.bitacora.todos")}</option>
            <option value="2xx">{t("admin.bitacora.estados.ok")}</option>
            <option value="4xx">{t("admin.bitacora.estados.cliente")}</option>
            <option value="5xx">{t("admin.bitacora.estados.servidor")}</option>
          </select>
        </div>
        <div className="ad-filtros__acciones">
          <button type="submit" className="ad-btn ad-btn--primary">{t("admin.bitacora.filtrar")}</button>
          <button type="button" className="ad-btn" onClick={limpiar}>{t("admin.bitacora.limpiar")}</button>
        </div>
      </form>

      {loading && !datos && (
        <div className="ad-skeleton" role="status" aria-busy="true" aria-label={t("comun.cargando")}>
          {[0, 1, 2, 3, 4, 5].map(i => <div key={i} className="ad-sk" />)}
        </div>
      )}

      {error && (
        <div className="ad-error" role="alert">
          <p>{t("admin.bitacora.error")}</p>
          <button type="button" className="ad-btn" onClick={() => { setLoading(true); setIntento(n => n + 1); }}>{t("admin.reintentar")}</button>
        </div>
      )}

      {datos && !error && items.length === 0 && (
        <div className="ad-empty">
          <p>{t(hayFiltros ? "admin.bitacora.sinResultados" : "admin.bitacora.vacia")}</p>
          {hayFiltros && <button type="button" className="ad-btn" onClick={limpiar}>{t("admin.bitacora.limpiar")}</button>}
        </div>
      )}

      {datos && !error && items.length > 0 && (
        <>
          <div className={`ad-table-wrap${loading ? " ad-table-wrap--cargando" : ""}`} ref={tablaRef} tabIndex={-1} aria-busy={loading}>
            <table className="ad-table ad-table--bitacora" role="table">
              <caption className="ad-sr-only">{t("admin.bitacora.caption", { pagina: datos.pagina, paginas: datos.paginas })}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th scope="col" role="columnheader">{t("admin.bitacora.col.accion")}</th>
                  <th scope="col" role="columnheader">{t("admin.bitacora.col.fecha")}</th>
                  <th scope="col" role="columnheader">{t("admin.bitacora.col.usuario")}</th>
                  <th scope="col" role="columnheader">{t("admin.bitacora.col.ruta")}</th>
                  <th scope="col" role="columnheader">{t("admin.bitacora.col.estado")}</th>
                  <th scope="col" role="columnheader">{t("admin.bitacora.col.detalles")}</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {items.map(r => (
                  <tr key={r._id} role="row">
                    <th scope="row" role="rowheader" className="ad-cell-nombre ad-cell-accion" data-label={t("admin.bitacora.col.accion")}>
                      <span className="ad-valor">{r.accion}</span>
                    </th>
                    <td role="cell" className="ad-cell-fecha" data-label={t("admin.bitacora.col.fecha")}>{fmtFecha.format(new Date(r.fecha))}</td>
                    <td role="cell" className="ad-cell-email" data-label={t("admin.bitacora.col.usuario")}>
                      <span className={`ad-valor${r.email ? "" : " ad-valor--falta"}`}>{r.email ?? t("admin.bitacora.sinSesion")}</span>
                    </td>
                    <td role="cell" className="ad-cell-ruta" data-label={t("admin.bitacora.col.ruta")}>
                      <span className="ad-valor"><span className="ad-metodo">{r.metodo}</span> {r.ruta}</span>
                    </td>
                    <td role="cell" data-label={t("admin.bitacora.col.estado")}>
                      <span className={`ad-code ${claseEstado(r.statusCode)}`}>{r.statusCode ?? t("admin.bitacora.evento")}</span>
                    </td>
                    <td role="cell" className="ad-cell-detalles" data-label={t("admin.bitacora.col.detalles")}>
                      <span className="ad-valor">{r.detalles ?? "—"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {datos.paginas > 1 && (
            <nav className="ad-paginacion" aria-label={t("admin.bitacora.paginacion")}>
              <button type="button" className="ad-btn" onClick={() => irAPagina(datos.pagina - 1)} disabled={loading || datos.pagina <= 1}>
                {t("admin.bitacora.anterior")}
              </button>
              <span className="ad-paginacion__estado" aria-live="polite">
                {t("admin.bitacora.pagina", { pagina: datos.pagina, paginas: datos.paginas })}
              </span>
              <button type="button" className="ad-btn" onClick={() => irAPagina(datos.pagina + 1)} disabled={loading || datos.pagina >= datos.paginas}>
                {t("admin.bitacora.siguiente")}
              </button>
            </nav>
          )}
        </>
      )}
    </>
  );
}
