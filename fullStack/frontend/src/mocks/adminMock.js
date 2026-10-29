/* Usuarios de ejemplo con la forma que devuelve GET /users/todos (backend). */

export const MOCK_USUARIOS = [
  { _id: "m1", nombre: "Mauro Beltrán",    email: "mauro@example.com",          rol: "admin",   familias: ["f2"], patentes: [], createdAt: "2026-03-02T14:10:00.000Z", onboardingCompleto: true  },
  { _id: "m2", nombre: "Juan Pérez",       email: "juan.perez@example.com",     rol: "usuario", familias: ["f1"], patentes: [], createdAt: "2026-05-18T09:32:00.000Z", onboardingCompleto: true  },
  { _id: "m3", nombre: "Lucía Fernández",  email: "lucia.fernandez@example.com", rol: "usuario", familias: ["f1", "f3"], patentes: [], createdAt: "2026-07-21T18:05:00.000Z", onboardingCompleto: true  },
  { _id: "m4", nombre: "Tomás Giménez",    email: "tomi.gimenez@example.com",   rol: "usuario", familias: ["f1"], patentes: ["p8"], createdAt: "2026-08-30T22:47:00.000Z", onboardingCompleto: false },
  { _id: "m5", nombre: "María de los Ángeles Rodríguez Echeverría", email: "maria.rodriguez.echeverria@example.com", rol: "usuario", familias: ["f1"], patentes: [], createdAt: "2026-09-14T11:20:00.000Z", onboardingCompleto: true },
  { _id: "m6", nombre: "Sofía Acosta",     email: "sofi.acosta@example.com",    rol: "usuario", familias: ["f1"], patentes: [], createdAt: "2026-10-06T16:58:00.000Z", onboardingCompleto: false },
];

/* Forma de GET /permisos/patentes y GET /permisos/familias. */

export const MOCK_PATENTES = [
  { _id: "p1",  codigo: "plan.ver",              descripcion: "Ver el plan propio y la adherencia" },
  { _id: "p2",  codigo: "plan.generar",          descripcion: "Generar o regenerar el plan con IA" },
  { _id: "p3",  codigo: "checkin.registrar",     descripcion: "Completar el checklist diario" },
  { _id: "p4",  codigo: "perfil.editar",         descripcion: "Editar el perfil y el onboarding" },
  { _id: "p5",  codigo: "cuenta.borrar",         descripcion: "Borrar la cuenta propia" },
  { _id: "p6",  codigo: "usuarios.listar",       descripcion: "Ver el listado de usuarios" },
  { _id: "p7",  codigo: "usuarios.borrar",       descripcion: "Borrar cuentas de otros usuarios" },
  { _id: "p8",  codigo: "bitacora.ver",          descripcion: "Consultar la bitácora" },
  { _id: "p9",  codigo: "integridad.verificar",  descripcion: "Verificar los dígitos verificadores" },
  { _id: "p10", codigo: "integridad.recalcular", descripcion: "Recalcular los dígitos verificadores" },
  { _id: "p11", codigo: "backup.ejecutar",       descripcion: "Generar un backup de la base" },
  { _id: "p12", codigo: "familias.gestionar",    descripcion: "Crear y editar familias y asignar permisos" },
];

export const MOCK_FAMILIAS = [
  { _id: "f2", nombre: "Administrador", descripcion: "Todo lo de Usuario más la administración del sistema", protegida: true,  patentes: ["p6", "p7", "p8", "p9", "p10", "p11", "p12"], familias: ["f1"] },
  { _id: "f3", nombre: "Auditor",       descripcion: "Solo lectura de bitácora e integridad",                  protegida: false, patentes: ["p8", "p9"], familias: [] },
  { _id: "f1", nombre: "Usuario",       descripcion: "Uso normal de la app",                                   protegida: true,  patentes: ["p1", "p2", "p3", "p4", "p5"], familias: [] },
];

/* En preview se navega como admin: todas las patentes. */
export const MOCK_PERMISOS = MOCK_PATENTES.map(p => p.codigo);

/* Forma de GET /integridad/verificar, con un usuario editado a mano. */
export const MOCK_INTEGRIDAD = {
  ok: false,
  verificadoEn: "2026-10-28T21:40:00.000Z",
  colecciones: [
    {
      coleccion: "users", totalRegistros: 6, dvvGuardado: 37383, dvvCalculado: 37412,
      filasAlteradas: [{ id: "m4", coleccion: "users", referencia: "tomi.gimenez@example.com", dvhGuardado: 4120, dvhCalculado: 4149 }],
      ok: false,
    },
    { coleccion: "plans",    totalRegistros: 4,  dvvGuardado: 6477,  dvvCalculado: 6477,  filasAlteradas: [], ok: true },
    { coleccion: "checkins", totalRegistros: 21, dvvGuardado: 13531, dvvCalculado: 13531, filasAlteradas: [], ok: true },
  ],
};

/* Forma de GET /bitacora y GET /bitacora/acciones. */
const ACCIONES_MOCK = [
  ["Inicio de sesión", "POST", "/auth/login", 200, null, "juan.perez@example.com"],
  ["Evento: checkin registrado", "EVENTO", "checkin.registrado", null, "fecha 2026-10-28, puntaje 2", "juan.perez@example.com"],
  ["Registro de checkin", "POST", "/checkins/", 200, null, "juan.perez@example.com"],
  ["Inicio de sesión", "POST", "/auth/login", 400, "Credenciales inválidas", null],
  ["Verificación de integridad", "GET", "/integridad/verificar", 200, null, "mauro@example.com"],
  ["Evento: plan generado", "EVENTO", "plan.generado", null, "plan 6ae2abb3733d6f59d06809a7", "lucia.fernandez@example.com"],
  ["Generación de plan", "POST", "/plan/generar", 503, "El servicio de IA no está disponible. Intentá de nuevo.", "tomi.gimenez@example.com"],
  ["Eliminación de usuario por admin", "DELETE", "/users/6ae2a5b7e70347ff5e60bf7c", 200, null, "mauro@example.com"],
];

export const MOCK_BITACORA = {
  ok: true,
  items: Array.from({ length: 25 }, (_, i) => {
    const [accion, metodo, ruta, statusCode, detalles, email] = ACCIONES_MOCK[i % ACCIONES_MOCK.length];
    return { _id: `b${i}`, fecha: new Date(Date.parse("2026-10-28T23:00:00Z") - i * 7 * 60000).toISOString(), email, accion, metodo, ruta, statusCode, detalles };
  }),
  total: 758,
  pagina: 1,
  porPagina: 25,
  paginas: 31,
};

export const MOCK_ACCIONES = [...new Set(ACCIONES_MOCK.map(a => a[0]))].sort((a, b) => a.localeCompare(b, "es"));

/* Forma de GET /backup. */
export const MOCK_BACKUPS = [
  { nombre: "backup_2026-10-28_23-33-08", creadoEn: "2026-10-29T02:33:08.000Z", colecciones: 7, documentos: 790, bytes: 313446, valido: true },
  { nombre: "backup_2026-10-27_03-00-00", creadoEn: "2026-10-27T06:00:00.000Z", colecciones: 7, documentos: 702, bytes: 288120, valido: true },
  { nombre: "backup_2026-10-26_03-00-00", creadoEn: "2026-10-26T06:00:00.000Z", colecciones: 7, documentos: 655, bytes: 271904, valido: true },
];
