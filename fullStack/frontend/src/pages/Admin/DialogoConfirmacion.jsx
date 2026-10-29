import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";

// Diálogo modal para confirmar una acción de admin (borrar, recalcular, ...).
// El foco arranca en Cancelar, Escape cierra y Tab no sale del diálogo.
export default function DialogoConfirmacion({
  titulo, texto, children, error, ocupado,
  textoConfirmar, textoOcupado, peligro = false,
  onCancel, onConfirm,
}) {
  const { t }       = useTranslation();
  const cancelarRef = useRef(null);
  const cajaRef     = useRef(null);

  useEffect(() => { cancelarRef.current?.focus(); }, []);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === "Escape" && !ocupado) { onCancel(); return; }
      if (e.key !== "Tab") return;
      // el foco no sale del diálogo mientras está abierto
      const botones = cajaRef.current.querySelectorAll("button:not(:disabled)");
      if (!botones.length) return;
      const primero = botones[0];
      const ultimo  = botones[botones.length - 1];
      if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [ocupado, onCancel]);

  return (
    <div
      className="ad-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !ocupado) onCancel(); }}
    >
      <div
        className="ad-dialog"
        ref={cajaRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="ad-dialog-titulo"
        aria-describedby="ad-dialog-texto"
      >
        <h2 className="ad-dialog__title" id="ad-dialog-titulo">{titulo}</h2>
        <p className="ad-dialog__text" id="ad-dialog-texto">{texto}</p>
        {children}

        {error && <p className="ad-dialog__error" role="alert">{error}</p>}

        <div className="ad-dialog__actions">
          <button type="button" className="ad-btn" ref={cancelarRef} onClick={onCancel} disabled={ocupado}>
            {t("admin.cancelar")}
          </button>
          <button
            type="button"
            className={`ad-btn ${peligro ? "ad-btn--danger" : "ad-btn--primary"}`}
            onClick={onConfirm}
            disabled={ocupado}
          >
            {ocupado ? textoOcupado : textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
