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
