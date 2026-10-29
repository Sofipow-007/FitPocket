import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { API_URL } from "../../lib/api";
import { MOCK_BACKUPS } from "../../mocks/adminMock";

const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

function formatearTamanio(bytes, idioma) {
  const fmt = new Intl.NumberFormat(idioma === "en" ? "en-US" : "es-AR", { maximumFractionDigits: 1 });
  if (bytes >= 1024 * 1024) return `${fmt.format(bytes / 1024 / 1024)} MB`;
  return `${fmt.format(bytes / 1024)} KB`;
}

// Genera backups en el servidor y lista los que hay. El restore no está acá a propósito:
// reemplaza datos de toda la base y se hace por consola con scripts/restore.js.
export default function BackupTab({ isPreview }) {
  const navigate    = useNavigate();
  const { t, i18n } = useTranslation();

  const [backups,   setBackups]   = useState(isPreview ? MOCK_BACKUPS : []);
  const [loading,   setLoading]   = useState(!isPreview);
  const [error,     setError]     = useState(false);
  const [generando, setGenerando] = useState(false);
  const [errorGen,  setErrorGen]  = useState(false);
  const [aviso,     setAviso]     = useState("");
  const [intento,   setIntento]   = useState(0);
  const [retencion, setRetencion] = useState(7);

  const fmtFecha = useMemo(
    () => new Intl.DateTimeFormat(i18n.language === "en" ? "en-US" : "es-AR", { dateStyle: "medium", timeStyle: "short" }),
    [i18n.language],
  );

  const pedir = (opciones = {}) => fetch(`${API_URL}/backup`, {
    ...opciones,
    headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
  }).then(r => {
    if (r.status === 401) {
      localStorage.removeItem("token");
      navigate("/login", { replace: true });
      throw new Error("401");
    }
    return r.ok ? r.json() : Promise.reject(new Error(String(r.status)));
  });

  useEffect(() => {
    if (isPreview) return;
    let vigente = true;
    pedir()
      .then(d => {
        if (!vigente) return;
        setBackups(d.backups ?? []);
        if (d.retencion) setRetencion(d.retencion);
      })
      .catch(() => { if (vigente) setError(true); })
      .finally(() => { if (vigente) setLoading(false); });
    return () => { vigente = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPreview, intento]);

  const generar = async () => {
    setGenerando(true);
    setErrorGen(false);
    setAviso("");
    try {
      let nuevo, borrados = [];
      if (isPreview) {
        nuevo = { ...MOCK_BACKUPS[0], nombre: "backup_2026-10-28_23-59-59", creadoEn: new Date().toISOString() };
      } else {
        const data = await pedir({ method: "POST" });
        nuevo = data.backup;
        borrados = data.borrados ?? [];
      }
      setBackups(bs => [nuevo, ...bs.filter(b => !borrados.includes(b.nombre))]);
      setAviso(t("admin.backup.generado", { nombre: nuevo.nombre, documentos: nuevo.documentos }));
    } catch {
      setErrorGen(true);
    } finally {
      setGenerando(false);
    }
  };

  return (
    <>
      <header className="ad-header">
        <div>
          <h2 className="ad-subtitle">{t("admin.backup.titulo")}</h2>
          <p className="ad-intro">{t("admin.backup.intro", { retencion })}</p>
        </div>
      </header>

      <div className="ad-acciones">
        <button type="button" className="ad-btn ad-btn--primary" onClick={generar} disabled={generando}>
          <IconDownload /> <span>{generando ? t("admin.backup.generando") : t("admin.backup.generar")}</span>
        </button>
      </div>

      <p className="ad-aviso" role="status" aria-live="polite">{aviso}</p>
      {errorGen && <p className="ad-form__error" role="alert">{t("admin.backup.errorGenerar")}</p>}

      <section className="ad-section" aria-labelledby="ad-backups-titulo">
        <h3 className="ad-alteradas__titulo" id="ad-backups-titulo">{t("admin.backup.disponibles")}</h3>

        {loading && (
          <div className="ad-skeleton" role="status" aria-busy="true" aria-label={t("comun.cargando")}>
            {[0, 1, 2].map(i => <div key={i} className="ad-sk" />)}
          </div>
        )}

        {!loading && error && (
          <div className="ad-error" role="alert">
            <p>{t("admin.backup.errorListar")}</p>
            <button type="button" className="ad-btn" onClick={() => { setError(false); setLoading(true); setIntento(n => n + 1); }}>
              {t("admin.reintentar")}
            </button>
          </div>
        )}

        {!loading && !error && backups.length === 0 && <p className="ad-empty">{t("admin.backup.vacio")}</p>}

        {!loading && !error && backups.length > 0 && (
          <ul className="ad-backups">
            {backups.map((b, i) => (
              <li key={b.nombre} className="ad-backup">
                <div className="ad-backup__principal">
                  <span className="ad-backup__fecha">
                    {b.creadoEn ? fmtFecha.format(new Date(b.creadoEn)) : b.nombre}
                    {i === 0 && <span className="ad-badge ad-badge--admin">{t("admin.backup.ultimo")}</span>}
                    {!b.valido && <span className="ad-badge ad-badge--mal">{t("admin.backup.incompleto")}</span>}
                  </span>
                  <span className="ad-backup__nombre">{b.nombre}</span>
                </div>
                <span className="ad-backup__meta">
                  {t("admin.backup.resumen", { colecciones: b.colecciones, documentos: b.documentos, tamanio: formatearTamanio(b.bytes, i18n.language) })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="ad-section" aria-labelledby="ad-restore-titulo">
        <h3 className="ad-alteradas__titulo" id="ad-restore-titulo">{t("admin.backup.restoreTitulo")}</h3>
        <p className="ad-intro">{t("admin.backup.restoreTexto")}</p>
        <pre className="ad-codigo"><code>cd fullStack/backend{"\n"}node scripts/restore.js{"\n"}node scripts/restore.js backup_AAAA-MM-DD_HH-MM-SS</code></pre>
        <p className="ad-field__ayuda">{t("admin.backup.restoreAyuda")}</p>
      </section>
    </>
  );
}
