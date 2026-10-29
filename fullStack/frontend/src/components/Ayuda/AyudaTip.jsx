import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./AyudaTip.css";

// Ícono "?" con una explicación corta (patrón toggletip).
// - Se abre con clic, Enter o Espacio: anda igual con mouse, teclado y pantalla táctil.
// - Escape, un clic afuera o sacar el foco lo cierran.
// - El texto va en una región role="status": el lector de pantalla lo lee al abrirse.
// `etiqueta` es el nombre accesible del botón ("Qué es la racha").
// `ancla` (opcional) agrega un link "Más en Ayuda" a /ayuda#ancla.
export default function AyudaTip({ etiqueta, texto, ancla, lado = "centro" }) {
  const { t }   = useTranslation();
  const [abierto, setAbierto] = useState(false);
  const raizRef    = useRef(null);
  const burbujaRef = useRef(null);
  const id         = useId();

  // Si el globo se sale de la pantalla (ícono cerca de un borde, sobre todo en mobile),
  // se corre lo justo para que quede adentro con 16px de margen.
  useLayoutEffect(() => {
    const burbuja = burbujaRef.current;
    if (!abierto || !burbuja) return;
    burbuja.style.marginLeft = "0px";
    const { left, right } = burbuja.getBoundingClientRect();
    const margen = 16;
    const ancho  = document.documentElement.clientWidth;
    if (right > ancho - margen) burbuja.style.marginLeft = `${ancho - margen - right}px`;
    else if (left < margen) burbuja.style.marginLeft = `${margen - left}px`;
  }, [abierto]);

  useEffect(() => {
    if (!abierto) return;
    const cerrarSiAfuera = (e) => { if (!raizRef.current?.contains(e.target)) setAbierto(false); };
    const cerrarConEscape = (e) => {
      if (e.key !== "Escape") return;
      setAbierto(false);
      raizRef.current?.querySelector("button")?.focus();
    };
    document.addEventListener("pointerdown", cerrarSiAfuera);
    document.addEventListener("keydown", cerrarConEscape);
    return () => {
      document.removeEventListener("pointerdown", cerrarSiAfuera);
      document.removeEventListener("keydown", cerrarConEscape);
    };
  }, [abierto]);

  // Al salir del componente con Tab se cierra (pero no al pasar del botón al link de adentro)
  const alPerderFoco = (e) => {
    if (!raizRef.current?.contains(e.relatedTarget)) setAbierto(false);
  };

  return (
    <span className={`ayuda-tip ayuda-tip--${lado}`} ref={raizRef} onBlur={alPerderFoco}>
      <button
        type="button"
        className="ayuda-tip__btn"
        aria-label={etiqueta}
        aria-expanded={abierto}
        aria-controls={id}
        onClick={(e) => { e.stopPropagation(); setAbierto(a => !a); }}
      >
        <span aria-hidden="true">?</span>
      </button>
      <span role="status" id={id} className="ayuda-tip__region">
        {abierto && (
          <span className="ayuda-tip__burbuja" ref={burbujaRef}>
            <span className="ayuda-tip__texto">{texto}</span>
            {ancla && (
              <Link className="ayuda-tip__mas" to={`/ayuda#${ancla}`}>{t("ayuda.masEnAyuda")}</Link>
            )}
          </span>
        )}
      </span>
    </span>
  );
}
