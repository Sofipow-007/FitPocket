import { clsx } from "clsx";
import { twMerge } from "tailwind-merge"

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function normalize(s = "") {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

// Fecha calendario (YYYY-MM-DD) en horario de Argentina, para que
// coincida con las fechas que devuelve el backend (ver backend/utils/fecha.js).
const fechaFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "America/Argentina/Buenos_Aires",
});

export function fechaLocal(fecha = new Date()) {
  return fechaFormatter.format(fecha);
}
