import { useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import usePermisos from "../../hooks/usePermisos";
import { MOCK_INTEGRIDAD } from "../../mocks/adminMock";
import DialogoConfirmacion from "./DialogoConfirmacion";
import AyudaTip from "../../components/Ayuda/AyudaTip";

const IconShield = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /><polyline points="9 12 11 14 15 10" />
  </svg>
);

// En preview, "recalcular" deja todo como si el backend lo hubiera aceptado
const MOCK_RECALCULADO = {
  ...MOCK_INTEGRIDAD,
  ok: true,
  colecciones: MOCK_INTEGRIDAD.colecciones.map(c => ({ ...c, filasAlteradas: [], dvvGuardado: c.dvvCalculado, ok: true })),
};

// Verificación de dígitos verificadores: el backend recalcula el DVH de cada fila
// y compara la suma con el DVV guardado. Recalcular acepta los datos actuales como válidos.
export default function IntegridadTab({ isPreview }) {
  const navigate    = useNavigate();
  const { t, i18n } = useTranslation();
  const { tiene }   = usePermisos();

  const [resultado,    setResultado]    = useState(null);
  const [verificando,  setVerificando]  = useState(false);
  const [error,        setError]        = useState("");
  const [confirmar,    setConfirmar]    = useState(false);
  const [recalculando, setRecalculando] = useState(false);
  const [errorRecalc,  setErrorRecalc]  = useState("");
  const [aviso,        setAviso]        = useState("");
  const recalcularRef = useRef(null);

  const fmtFecha = useMemo(
    () => new Intl.DateTimeFormat(i18n.language === "en" ? "en-US" : "es-AR", { dateStyle: "short", timeStyle: "short" }),
    [i18n.language],
  );

  const pedir = async (ruta, opciones = {}) => {
    const res = await fetch(`${API_URL}${ruta}`, {
      ...opciones,
      headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
    });
    if (res.status === 401) {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      throw new Error("401");
    }
    if (!res.ok) throw new Error(String(res.status));
    return res.json();
  };

  const verificar = async () => {
    setVerificando(true);
    setError("");
    setAviso("");
    try {
      const data = isPreview ? MOCK_INTEGRIDAD : await pedir("/integridad/verificar");
      setResultado(data);
      setAviso(t(data.ok ? "admin.integridad.avisoOk" : "admin.integridad.avisoAlterada"));
    } catch {
      setError(t("admin.integridad.errorVerificar"));
    } finally {
      setVerificando(false);
    }
  };

  const cerrarConfirmacion = () => {
    setConfirmar(false);
    recalcularRef.current?.focus();
  };

  const recalcular = async () => {
    setRecalculando(true);
    setErrorRecalc("");
    try {
      // después de recalcular se vuelve a verificar, para mostrar el estado real
      let data = MOCK_RECALCULADO;
      if (!isPreview) {
        await pedir("/integridad/recalcular", { method: "POST" });
        data = await pedir("/integridad/verificar");
      }
      setResultado(data);
      setAviso(t("admin.integridad.avisoRecalculado"));
      cerrarConfirmacion();
    } catch {
      setErrorRecalc(t("admin.integridad.errorRecalcular"));
    } finally {
      setRecalculando(false);
    }
  };

  const nombreColeccion = (c) => t(`admin.integridad.colecciones.${c}`, { defaultValue: c });
  const alteradas = resultado?.colecciones.flatMap(c => c.filasAlteradas) ?? [];

  return (
    <>
      <header className="ad-header">
        <div>
          <h2 className="ad-subtitle">{t("admin.integridad.titulo")} <AyudaTip etiqueta={t("ayuda.tips.seccionEtiqueta", { seccion: t("admin.tabs.integridad") })} texto={t("ayuda.tips.integridad")} ancla="admin-integridad" lado="izq" /></h2>
          <p className="ad-intro">{t("admin.integridad.intro")}</p>
        </div>
      </header>

      <div className="ad-acciones">
        <button type="button" className="ad-btn ad-btn--primary" onClick={verificar} disabled={verificando}>
          <IconShield /> <span>{verificando ? t("admin.integridad.verificando") : t("admin.integridad.verificar")}</span>
        </button>
        {tiene("integridad.recalcular") && (
          <button
            type="button"
            className="ad-btn"
            ref={recalcularRef}
            onClick={() => { setErrorRecalc(""); setConfirmar(true); }}
            disabled={verificando}
          >
            {t("admin.integridad.recalcular")}
          </button>
        )}
      </div>

      {/* el resumen ya lo muestra en pantalla: el aviso queda solo para el lector de pantalla */}
      <p className="ad-sr-only" role="status" aria-live="polite">{aviso}</p>

      {error && (
        <div className="ad-error" role="alert">
          <p>{error}</p>
          <button type="button" className="ad-btn" onClick={verificar}>{t("admin.reintentar")}</button>
        </div>
      )}

      {!resultado && !error && !verificando && (
        <p className="ad-empty">{t("admin.integridad.sinVerificar")}</p>
      )}

      {resultado && (
        <>
          <div className={`ad-resumen ${resultado.ok ? "ad-resumen--ok" : "ad-resumen--mal"}`}>
            <span className="ad-resumen__titulo">
              {t(resultado.ok ? "admin.integridad.resumenOk" : "admin.integridad.resumenMal", { count: alteradas.length })}
            </span>
            {resultado.verificadoEn && (
              <span className="ad-resumen__hora">
                {t("admin.integridad.verificadoEn", { fecha: fmtFecha.format(new Date(resultado.verificadoEn)) })}
              </span>
            )}
          </div>

          <div className="ad-table-wrap">
            <table className="ad-table ad-table--integridad" role="table">
              <caption className="ad-sr-only">{t("admin.integridad.tablaCaption")}</caption>
              <thead role="rowgroup">
                <tr role="row">
                  <th scope="col" role="columnheader">{t("admin.integridad.col.coleccion")}</th>
                  <th scope="col" role="columnheader">{t("admin.integridad.col.registros")}</th>
                  <th scope="col" role="columnheader">{t("admin.integridad.col.alteradas")}</th>
                  <th scope="col" role="columnheader">{t("admin.integridad.col.dvvGuardado")}</th>
                  <th scope="col" role="columnheader">{t("admin.integridad.col.dvvCalculado")}</th>
                  <th scope="col" role="columnheader">{t("admin.integridad.col.estado")}</th>
                </tr>
              </thead>
              <tbody role="rowgroup">
                {resultado.colecciones.map(c => (
                  <tr key={c.coleccion} role="row">
                    <th scope="row" role="rowheader" className="ad-cell-nombre">{nombreColeccion(c.coleccion)}</th>
                    <td role="cell" className="ad-num" data-label={t("admin.integridad.col.registros")}>{c.totalRegistros}</td>
                    <td role="cell" className="ad-num" data-label={t("admin.integridad.col.alteradas")}>{c.filasAlteradas.length}</td>
                    <td role="cell" className="ad-num" data-label={t("admin.integridad.col.dvvGuardado")}>{c.dvvGuardado}</td>
                    <td
                      role="cell"
                      className={`ad-num${c.dvvGuardado !== c.dvvCalculado ? " ad-num--mal" : ""}`}
                      data-label={t("admin.integridad.col.dvvCalculado")}
                    >
                      {c.dvvCalculado}
                    </td>
                    <td role="cell" data-label={t("admin.integridad.col.estado")}>
                      <span className={`ad-badge ${c.ok ? "ad-badge--admin" : "ad-badge--mal"}`}>
                        {t(c.ok ? "admin.integridad.ok" : "admin.integridad.alterada")}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {alteradas.length > 0 && (
            <section className="ad-alteradas" aria-labelledby="ad-alteradas-titulo">
              <h3 className="ad-alteradas__titulo" id="ad-alteradas-titulo">
                {t("admin.integridad.filasTitulo", { count: alteradas.length })}
              </h3>
              <ul className="ad-alteradas__lista">
                {alteradas.map(f => (
                  <li key={`${f.coleccion}-${f.id}`} className="ad-alterada">
                    <span className="ad-badge ad-badge--mal">{nombreColeccion(f.coleccion)}</span>
                    <span className="ad-alterada__ref">{f.referencia}</span>
                    <span className="ad-alterada__id">{f.id}</span>
                    <span className="ad-alterada__dvh">
                      {t("admin.integridad.dvhDiferencia", { guardado: f.dvhGuardado ?? "—", calculado: f.dvhCalculado })}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      {confirmar && (
        <DialogoConfirmacion
          titulo={t("admin.integridad.confirmarTitulo")}
          texto={t("admin.integridad.confirmarTexto")}
          error={errorRecalc}
          ocupado={recalculando}
          textoConfirmar={t("admin.integridad.recalcular")}
          textoOcupado={t("admin.integridad.recalculando")}
          onCancel={cerrarConfirmacion}
          onConfirm={recalcular}
        />
      )}
    </>
  );
}
