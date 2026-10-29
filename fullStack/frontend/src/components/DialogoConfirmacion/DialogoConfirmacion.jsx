import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import "./DialogoConfirmacion.css";

// Diálogo modal para confirmar una acción importante (borrar, recalcular, ...).
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
      className="dlg-overlay"
      onClick={(e) => { if (e.target === e.currentTarget && !ocupado) onCancel(); }}
    >
      <div
        className="dlg"
        ref={cajaRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="dlg-titulo"
        aria-describedby="dlg-texto"
      >
        <h2 className="dlg__title" id="dlg-titulo">{titulo}</h2>
        <p className="dlg__text" id="dlg-texto">{texto}</p>
        {children}

        {error && <p className="dlg__error" role="alert">{error}</p>}

        <div className="dlg__actions">
          <button type="button" className="dlg__btn" ref={cancelarRef} onClick={onCancel} disabled={ocupado}>
            {t("admin.cancelar")}
          </button>
          <button
            type="button"
            className={`dlg__btn ${peligro ? "dlg__btn--danger" : "dlg__btn--primary"}`}
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
