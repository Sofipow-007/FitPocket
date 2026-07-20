import { normalize } from "./utils";

/* ── Categorías de ejercicio + ilustraciones ── */
export const EX_CATS = {
  push: {
    muscles: { es: "Pecho · Tríceps · Hombros", en: "Chest · Triceps · Shoulders" },
    tip:     { es: "Controlá el descenso. Pausa en el pecho antes de empujar.", en: "Control the descent. Pause at the chest before pushing." },
    illu: (
      <svg viewBox="0 0 90 56" fill="none" aria-hidden="true">
        <rect x="20" y="36" width="55" height="5" rx="2.5" fill="currentColor" opacity="0.2"/>
        <path d="M63 36 L68 50 M68 50 L76 50" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M26 36 L63 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <circle cx="22" cy="33" r="5" fill="currentColor"/>
        <path d="M35 36 L35 22 M55 36 L55 22" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <rect x="8"  y="18" width="68" height="4" rx="2" fill="currentColor" opacity="0.6"/>
        <rect x="4"  y="13" width="6" height="14" rx="2" fill="currentColor"/>
        <rect x="80" y="13" width="6" height="14" rx="2" fill="currentColor"/>
      </svg>
    ),
  },
  pull: {
    muscles: { es: "Espalda · Bíceps · Romboides", en: "Back · Biceps · Rhomboids" },
    tip:     { es: "Retracción escapular al inicio. Codos cerca del cuerpo.", en: "Scapular retraction at the start. Keep elbows close." },
    illu: (
      <svg viewBox="0 0 90 56" fill="none" aria-hidden="true">
        <circle cx="18" cy="14" r="5.5" fill="currentColor"/>
        <path d="M22 18 L58 36" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <path d="M58 36 L58 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M50 44 L46 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M36 28 L26 18" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <rect x="18" y="12" width="12" height="8" rx="2" fill="currentColor" opacity="0.55"/>
        <path d="M44 32 L44 46" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <rect x="40" y="46" width="9" height="6" rx="2" fill="currentColor" opacity="0.55"/>
      </svg>
    ),
  },
  legs: {
    muscles: { es: "Cuádriceps · Glúteos · Isquiotibiales", en: "Quadriceps · Glutes · Hamstrings" },
    tip:     { es: "Rodillas alineadas con los pies. Espalda recta durante todo el movimiento.", en: "Knees aligned with feet. Keep back straight throughout." },
    illu: (
      <svg viewBox="0 0 90 60" fill="none" aria-hidden="true">
        <circle cx="45" cy="7" r="6" fill="currentColor"/>
        <rect x="14" y="13" width="62" height="4" rx="2" fill="currentColor" opacity="0.55"/>
        <rect x="10" y="8" width="6" height="14" rx="2" fill="currentColor"/>
        <rect x="74" y="8" width="6" height="14" rx="2" fill="currentColor"/>
        <path d="M45 17 L45 33" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <path d="M28 15 L36 19 M54 19 L62 15" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M42 33 L32 46 L28 56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M48 33 L58 46 L62 56" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"/>
      </svg>
    ),
  },
  core: {
    muscles: { es: "Abdomen · Core · Estabilizadores", en: "Abs · Core · Stabilizers" },
    tip:     { es: "Cuerpo en línea recta de cabeza a talones. Respiración constante.", en: "Body in a straight line from head to heels. Constant breathing." },
    illu: (
      <svg viewBox="0 0 90 50" fill="none" aria-hidden="true">
        <circle cx="12" cy="22" r="5" fill="currentColor"/>
        <path d="M16 25 L72 25" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round"/>
        <path d="M24 25 L20 36 M40 25 L40 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round"/>
        <path d="M18 36 L44 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.4"/>
        <path d="M72 25 L76 36" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M72 36 L80 36" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6"/>
      </svg>
    ),
  },
  general: {
    muscles: { es: "Músculos compuestos", en: "Compound muscles" },
    tip:     { es: "Técnica primero, peso después. Controlá cada repetición.", en: "Technique first, then weight. Control each repetition." },
    illu: (
      <svg viewBox="0 0 90 60" fill="none" aria-hidden="true">
        <circle cx="45" cy="8" r="6" fill="currentColor"/>
        <path d="M45 14 L45 38" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
        <path d="M45 22 L62 16 L64 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <rect x="60" y="2" width="14" height="8" rx="2" fill="currentColor" opacity="0.75"/>
        <path d="M45 22 L30 28 L28 38" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
        <path d="M43 38 L36 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
        <path d="M47 38 L54 52" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
      </svg>
    ),
  },
};

export function getExCat(nombre) {
  const n = normalize(nombre);
  if (/press|empuje|pecho|hombro|tricep|apert|fondos|dip|push/.test(n))        return "push";
  if (/remo|jal|pull|espalda|bicep|curl|dominada|chin|polea/.test(n))          return "pull";
  if (/sentadilla|squat|pierna|prensa|femoral|gluteo|lunges|zancada|hip/.test(n)) return "legs";
  if (/plancha|plank|abdomen|core|sit.?up|crunch|oblicuo/.test(n))             return "core";
  return "general";
}
