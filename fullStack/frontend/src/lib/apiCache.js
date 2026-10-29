import { API_URL } from "./api";

// Caché de las lecturas que se repiten entre pantallas (perfil, plan, permisos,
// adherencia). Vive en memoria y en sessionStorage: sobrevive a un F5 pero no a
// cerrar la pestaña. Cada entrada se guarda junto al token que la pidió, así que
// nunca se le muestran a una cuenta los datos de otra.
//
// Uso:
//   const { status, datos } = await pedirConCache("plan")
//   invalidar("plan", "semana")   // después de generar un plan
//   invalidarTodo()               // al cerrar sesión

const RECURSOS = {
  perfil:   { ruta: "/users/perfil",    ttlMs: 5 * 60 * 1000 },
  plan:     { ruta: "/plan/actual",     ttlMs: 5 * 60 * 1000 },
  permisos: { ruta: "/users/permisos",  ttlMs: 60 * 1000 },
  semana:   { ruta: "/checkins/semana", ttlMs: 2 * 60 * 1000 },
  hoy:      { ruta: "/checkins/hoy",    ttlMs: 2 * 60 * 1000 },
};

const PREFIJO = "fp:cache:";
const memoria = new Map();   // clave → { token, expira, status, datos }
const enVuelo = new Map();   // clave → promesa (dos pantallas que piden lo mismo comparten el pedido)
const forzar  = new Set();   // claves invalidadas: el próximo pedido saltea también la caché HTTP

const leerGuardado = (clave) => {
  if (memoria.has(clave)) return memoria.get(clave);
  try {
    const crudo = sessionStorage.getItem(PREFIJO + clave);
    const entrada = crudo ? JSON.parse(crudo) : null;
    if (entrada) memoria.set(clave, entrada);
    return entrada;
  } catch {
    return null;
  }
};

const guardar = (clave, entrada) => {
  memoria.set(clave, entrada);
  try { sessionStorage.setItem(PREFIJO + clave, JSON.stringify(entrada)); } catch { /* sin storage: queda en memoria */ }
};

const borrar = (clave) => {
  memoria.delete(clave);
  enVuelo.delete(clave);
  try { sessionStorage.removeItem(PREFIJO + clave); } catch { /* nada que borrar */ }
};

// Devuelve { status, datos }. Se guardan las respuestas 200 y 404 ("todavía no
// tenés plan" también es una respuesta válida); los errores no se guardan.
export function pedirConCache(clave) {
  const recurso = RECURSOS[clave];
  if (!recurso) return Promise.reject(new Error(`Recurso sin caché: ${clave}`));
  const token = localStorage.getItem("token");

  const guardado = leerGuardado(clave);
  if (guardado && guardado.token === token && guardado.expira > Date.now()) {
    return Promise.resolve({ status: guardado.status, datos: guardado.datos, desdeCache: true });
  }

  const vuelo = enVuelo.get(clave);
  if (vuelo && vuelo.token === token) return vuelo.promesa;

  const recargar = forzar.has(clave);
  forzar.delete(clave);
  const promesa = fetch(`${API_URL}${recurso.ruta}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: recargar ? "reload" : "default",
  })
    .then(async (r) => {
      const datos = await r.json().catch(() => null);
      if (r.status === 200 || r.status === 404) {
        guardar(clave, { token, expira: Date.now() + recurso.ttlMs, status: r.status, datos });
      }
      return { status: r.status, datos, desdeCache: false };
    })
    .finally(() => {
      if (enVuelo.get(clave)?.promesa === promesa) enVuelo.delete(clave);
    });

  enVuelo.set(clave, { token, promesa });
  return promesa;
}

// Después de un cambio (checkin, plan nuevo, perfil editado) se borran las claves afectadas
export function invalidar(...claves) {
  for (const clave of claves) {
    borrar(clave);
    forzar.add(clave);
  }
}

// Al cerrar sesión, borrar la cuenta o entrar con otra
export function invalidarTodo() {
  invalidar(...Object.keys(RECURSOS));
}

// Guarda en la caché un dato que ya se conoce (ej. el checkin recién guardado)
// para no tener que pedírselo de nuevo al servidor
export function actualizarCache(clave, status, datos) {
  const recurso = RECURSOS[clave];
  if (!recurso) return;
  guardar(clave, { token: localStorage.getItem("token"), expira: Date.now() + recurso.ttlMs, status, datos });
}
