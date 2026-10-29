# Cambios a aplicar en `Documentacion-FitPocket.docx`

Este archivo lista, sección por sección, qué hay que cambiar en la documentación principal para que refleje el proyecto después de la consigna final (rama `feature/consigna-final`, octubre de 2026). Está pensado para pasarlo al DOCX a mano: cada punto dice **dónde**, **qué texto reemplazar o agregar** y, cuando hace falta, **de qué archivo copiar** el contenido nuevo.

Se mantiene el criterio de la versión anterior: no se borra ningún requisito ni funcionalidad; lo que falta se marca **Pendiente**.

Los documentos nuevos que se citan están en esta misma carpeta `documentacion/`:

| Tema | Archivo |
|---|---|
| Participantes y roles | [`1-proyecto/participantes-y-roles.md`](participantes-y-roles.md) |
| Modelo de datos (DER) | [`3-base-de-datos/der-logico.md`](../3-base-de-datos/der-logico.md) |
| Backup, índices, particiones e integridad | [`3-base-de-datos/estrategia-de-datos.md`](../3-base-de-datos/estrategia-de-datos.md) |
| Diagrama de clases | [`4-backend/diagrama-de-clases.md`](../4-backend/diagrama-de-clases.md) |
| Patrones de diseño | [`4-backend/patrones-de-diseno.md`](../4-backend/patrones-de-diseno.md) |
| Diagrama general de casos de uso | [`5-casos-de-uso/diagrama-general.md`](../5-casos-de-uso/diagrama-general.md) |
| Especificación de casos de uso (fichas, DSS, clases) | [`5-casos-de-uso/especificaciones.md`](../5-casos-de-uso/especificaciones.md) |
| Seguridad | [`6-calidad/seguridad.md`](../6-calidad/seguridad.md) |
| Rendimiento | [`6-calidad/rendimiento.md`](../6-calidad/rendimiento.md) |
| Mantenimiento y sustitución | [`6-calidad/mantenimiento-y-sustitucion.md`](../6-calidad/mantenimiento-y-sustitucion.md) |
| Pruebas | [`pruebas/informe-de-pruebas.md`](../pruebas/informe-de-pruebas.md) |
| Despliegue | [`despliegue.md`](../despliegue.md) |
| Manual de usuario | [`manual-de-usuario.md`](../manual-de-usuario.md) |

---

## Portada

- **Versión actualizada:** cambiar "octubre de 2026" por la fecha de entrega.
- **Integrantes:** se mantiene. Agregar debajo la referencia a la nueva sección **Participantes y roles** (ver más abajo).

## Índice

Regenerarlo al final (en Word: clic derecho sobre el índice → *Actualizar campos → Actualizar toda la tabla*). Las secciones nuevas están marcadas con **(nueva)** en este archivo.

---

## Sobre esta versión

**Reemplazar** el primer párrafo por:

> Este documento actualiza la documentación de FitPocket para que describa el proyecto tal como está después de la consigna final (octubre de 2026). Cada afirmación sobre el estado actual fue contrastada con el código. Respecto de la versión anterior, se suman el panel de administración con control de acceso por patentes y familias, los dígitos verificadores horizontales y verticales en todas las colecciones, la ayuda en línea, el backup y restore multiplataforma, los patrones de diseño, las pruebas automatizadas y la preparación para el despliegue.

Los criterios (no eliminar requisitos, columna Estado, etc.) se mantienen.

---

## Participantes y roles **(nueva)**

Agregar una sección nueva después de **El equipo detrás de FitPocket**, copiando [`participantes-y-roles.md`](participantes-y-roles.md). **Los roles están como `[COMPLETAR]`**: los define el equipo; ahí hay una sugerencia basada en la autoría de los commits.

---

## Descripción de Usuarios de Sistema

- **Párrafo introductorio.** Reemplazar "El backend define además un rol de administrador, que hoy solo se usa a través de la API." por:
  > FitPocket contempla tres tipos de usuario: invitado, registrado y administrador. Lo que puede hacer cada usuario registrado no depende de un rol fijo sino de las **patentes** (permisos) que tiene asignadas, agrupadas en **familias**.
- **Usuario Invitado → Acceso.** Agregar: "y la página de Ayuda (`/ayuda`), que es pública".
- **Usuario Registrado → Capacidades.** Agregar "borrar su propia cuenta" y "consultar la Ayuda". Quitar "eliminar la cuenta" de los pendientes si figurara.
- **Usuario Administrador.** Reemplazar la descripción por:
  > Usuario que tiene la familia **Administrador**, que incluye a la familia Usuario más las patentes de administración. Tiene un panel propio (`/admin`) con cinco pestañas, cada una visible solo si tiene la patente correspondiente: **Usuarios** (listar y borrar cuentas), **Familias y permisos** (crear y editar familias, asignar familias o patentes sueltas a cada usuario), **Integridad** (verificar y recalcular los dígitos verificadores), **Bitácora** (consultar la actividad con filtros) y **Backup** (generar copias de la base). Un administrador no puede borrar a otro administrador, ni borrar su propia cuenta, ni cambiar sus propios permisos: así el sistema nunca queda sin administradores. El primer administrador se crea por consola con `node scripts/crearAdmin.js <email>`.

---

## Funcionalidades y Tecnicismos

- **Información del Usuario, último párrafo.** Sin cambios de fondo; se puede agregar: "Además del enlace por mail, la página de Ayuda explica el procedimiento."
- **Vista de su Perfil.** Agregar al final: "Desde la pestaña Progreso del dashboard, en la sección *Tu cuenta*, el usuario puede borrar su propia cuenta con confirmación; se eliminan también sus planes y checkins."
- **Registro de Avance.** En "Calcular la adherencia en porcentaje" cambiar a: "Parcial: la semanal se muestra en el dashboard; la mensual (últimos 30 días) ya la calcula el backend (`GET /checkins/mes`) y falta mostrarla." En el párrafo de la meta del 60%: agregar "Cuando la adherencia semanal baja del 50% con al menos tres días contados, el sistema registra una alerta en la bitácora y, si hay un servidor de correo configurado, le manda un mail al usuario (como mucho uno por día)."

### Secciones nuevas dentro de Funcionalidades

Agregar después de **Idiomas**:

**Ayuda (nueva).**
> La página `/ayuda` reúne preguntas frecuentes en español e inglés: cómo se genera el plan, cómo cambiar un ejercicio, cómo funciona el checklist, qué son la adherencia, la racha y el IMC, cómo recuperar la contraseña, qué datos se guardan encriptados, cómo borrar la cuenta y cómo cambiar el idioma; quienes tienen permisos de administración ven además una sección para administradores. Se llega desde el dashboard, el detalle del plan, el panel de administración y el pie de la página de inicio. Además, junto a la racha, el IMC, la adherencia, el checklist, el botón "cambiar ejercicio" y cada pestaña del panel hay un ícono "?" que muestra una explicación breve; se puede usar con el mouse, el teclado o la pantalla táctil, y los lectores de pantalla lo anuncian.

**Administración (nueva).** Resumen del panel (igual al texto de *Usuario Administrador*) y referencia al [manual de usuario](../manual-de-usuario.md), sección Administrador.

**Control de acceso: patentes y familias (nueva).**
> Cada acción protegida del sistema requiere una **patente** (permiso atómico, por ejemplo `plan.generar` o `usuarios.borrar`). Las patentes se agrupan en **familias**, y una familia puede contener otras familias: la familia Administrador incluye a la familia Usuario. Los permisos efectivos de un usuario son la unión de las patentes de todas sus familias (recorridas en profundidad) y de sus patentes sueltas. Se implementó con el patrón Composite. El backend valida la patente en cada pedido leyendo los permisos de la base, así que quitarle una familia a alguien le saca el acceso en el momento, sin esperar a que venza su sesión. El frontend oculta los botones para los que el usuario no tiene permiso, pero la decisión la toma siempre el backend.

Lista de patentes: `plan.ver`, `plan.generar`, `checkin.registrar`, `perfil.editar`, `cuenta.borrar` (familia Usuario) y `usuarios.listar`, `usuarios.borrar`, `bitacora.ver`, `integridad.verificar`, `integridad.recalcular`, `backup.ejecutar`, `familias.gestionar` (familia Administrador).

---

## Requisitos Funcionales

**Actualizar el estado** de estos requisitos:

| ID | Estado nuevo |
|---|---|
| RF08 | **Parcial.** Semanal implementada; la mensual la calcula el backend (`GET /checkins/mes`, últimos 30 días) y falta mostrarla en la interfaz. |
| RF10 | **Parcial.** Cuando la adherencia semanal baja del 50% con al menos 3 días contados se registra una alerta y, con SMTP configurado, se envía un mail (uno por día como máximo). Falta la notificación push y el criterio original de 60% en 72 horas. |
| RF21 | **Implementado.** Botón "Borrar mi cuenta" con confirmación en la pestaña Progreso. Un administrador no puede borrar su propia cuenta. |
| RF22 | **Implementado.** Panel `/admin` con listado, búsqueda y borrado de usuarios, y verificación de integridad con pantalla propia. |

**Agregar** al final de la tabla (continúan la numeración):

| ID | Descripción | Estado |
|---|---|---|
| RF23 | El sistema debe controlar el acceso a cada acción mediante patentes (permisos atómicos) agrupadas en familias, que pueden contener otras familias, y permitir a un administrador crear y editar familias y asignar familias o patentes sueltas a cada usuario. (Nuevo) | Implementado |
| RF24 | El sistema debe ocultar en la interfaz los botones y secciones para los que el usuario no tiene la patente correspondiente. (Nuevo) | Implementado |
| RF25 | El sistema debe permitir a un administrador verificar la integridad de usuarios, planes y checkins (recalculando cada DVH y comparando el DVV) y ver los registros alterados, y recalcular los dígitos después de revisar. (Nuevo) | Implementado |
| RF26 | El sistema debe permitir a un administrador consultar la bitácora paginada y filtrarla por usuario, acción, rango de fechas y resultado. (Nuevo) | Implementado |
| RF27 | El sistema debe permitir generar copias de seguridad de toda la base (desde el panel o por consola) y restaurarlas por consola, recalculando los dígitos verificadores al terminar. (Nuevo) | Implementado |
| RF28 | El sistema debe ofrecer una página de ayuda con preguntas frecuentes y explicaciones breves "?" junto a los datos y acciones que pueden generar dudas. (Nuevo) | Implementado |
| RF29 | El sistema debe registrar en la bitácora los eventos de negocio (plan generado, checkin registrado, usuario borrado, integridad alterada) además de cada pedido. (Nuevo) | Implementado |

## Requisitos no funcionales

**Actualizar el estado** de estos:

| ID | Estado nuevo |
|---|---|
| RNF06 | **Implementado.** Medido con carga sostenida (10 conexiones): `GET /plan/actual` responde con p95 de 52 ms y `GET /checkins/semana` con p95 de 53 ms. La generación del plan depende de la IA. Ver [rendimiento](../6-calidad/rendimiento.md). |
| RNF12 | **Implementado.** Además de cada pedido a la API, registra eventos de negocio. Es consultable desde el panel y conserva los últimos 180 días (configurable). No guarda contraseñas ni emails. |
| RNF13 | **Implementado.** Dígito verificador horizontal en usuarios, planes y checkins, y vertical por colección. Se mantienen solos en cada escritura. |

**Agregar:**

| ID | Descripción | Estado |
|---|---|---|
| RNF18 | El sistema debe validar las variables de entorno al iniciar y no arrancar si falta alguna obligatoria o si en producción se usan claves débiles o publicadas. (Nuevo) | Implementado |
| RNF19 | La API solo debe aceptar pedidos de navegador desde el origen del frontend configurado (CORS restringido). (Nuevo) | Implementado |
| RNF20 | El sistema debe contar con pruebas automatizadas unitarias, de integración, de seguridad y de rendimiento, que se ejecuten en cada push y pull request. (Nuevo) | Implementado. 103 pruebas de backend (85% de cobertura de líneas) y 25 de frontend, en GitHub Actions. |
| RNF21 | El proveedor de IA debe poder cambiarse por configuración sin modificar el resto del sistema. (Nuevo) | Implementado. `IA_PROVIDER=groq` u `ollama`. |
| RNF22 | El frontend debe evitar pedidos repetidos al servidor mediante una caché con invalidación, y el backend debe comprimir sus respuestas. (Nuevo) | Implementado |
| RNF23 | La base debe contar con índices para las consultas frecuentes y con un vencimiento automático de los registros de bitácora (partición temporal). (Nuevo) | Implementado |
| RNF24 | La interfaz nueva debe pasar una auditoría de accesibilidad (contraste, nombres accesibles, teclado, áreas táctiles). (Nuevo) | Implementado |

---

## Tecnologías y Herramientas

- **Backend.** Agregar al final: "Se organiza además con patrones de diseño (Singleton, Strategy, Factory Method, Observer y Composite); ver [patrones de diseño](../4-backend/patrones-de-diseno.md). Las respuestas se comprimen con gzip (`compression`)."
- **Base de datos.** Reemplazar "Las colecciones son usuarios, planes, checkins y bitácora." por "Las colecciones son usuarios, planes, checkins, bitácora, patentes, familias y dígitos verificadores verticales." Reemplazar la última oración por "El proyecto incluye scripts en Node para hacer y restaurar copias de respaldo en Windows, Linux o Mac (`backup.js`, `restore.js`), y para recalcular los dígitos verificadores."
- **Inteligencia Artificial.** Agregar: "El proveedor se elige con la variable `IA_PROVIDER`: Groq (por defecto) u Ollama, un servidor local de modelos abiertos."
- **Seguridad.** Reemplazar el párrafo por un resumen de [seguridad](../6-calidad/seguridad.md) (cinco renglones: bcrypt, JWT, AES-256, patentes y familias, DVH/DVV, bitácora, CORS, variables obligatorias).
- **Despliegue.** Reemplazar por:
  > El backend se prepara para Render (o Railway) y el frontend para Vercel (o Netlify). La guía paso a paso está en [`despliegue.md`](../despliegue.md). El backend tiene un Dockerfile de producción.
- **Pruebas (subsección nueva).** "Backend: Jest + Supertest + mongodb-memory-server (base en memoria); frontend: Vitest + Testing Library; rendimiento: autocannon; integración continua: GitHub Actions. Ver el [informe de pruebas](../pruebas/informe-de-pruebas.md)."
- **Tabla Planificado / Actual.** Agregar las filas:

  | Capa | Planificado originalmente | Actual |
  |---|---|---|
  | Control de acceso | Rol administrador | Patentes y familias (Composite) |
  | Pruebas | — | Jest, Supertest, Vitest, autocannon, GitHub Actions |
  | Despliegue | Vercel o Netlify | Render (backend) + Vercel (frontend), guía documentada |

---

## Diagramas

### Diagrama de Casos de Uso

**Reemplazar** el diagrama original (que tiene el actor "Sistema N8N / IA") por el de [`5-casos-de-uso/diagrama-general.md`](../5-casos-de-uso/diagrama-general.md). Para pegarlo en el DOCX como imagen: abrir el archivo en GitHub, o pegar el bloque Mermaid en [mermaid.live](https://mermaid.live) y exportar como PNG o SVG.

Reemplazar el párrafo introductorio por: "Actores: Invitado, Usuario registrado, Administrador y Servicio de IA (Groq). n8n ya no forma parte del proyecto."

En la tabla de casos de uso:

| Caso | Cambio |
|---|---|
| CU15 Recibir alerta | **Parcial.** Se registra la alerta y se envía mail si hay SMTP; falta push. |
| CU23 Eliminar la cuenta | **Implementado.** |

Y agregar:

| Caso de uso | Descripción | Estado |
|---|---|---|
| CU24 | Gestionar usuarios (listar, buscar, borrar) | Implementado |
| CU25 | Gestionar familias y permisos | Implementado |
| CU26 | Verificar integridad | Implementado |
| CU27 | Recalcular dígitos verificadores | Implementado |
| CU28 | Consultar bitácora | Implementado |
| CU29 | Generar backup | Implementado |
| CU30 | Restaurar backup (por consola) | Implementado |
| CU31 | Consultar ayuda | Implementado |

### Especificación de casos de uso **(nueva)**

Agregar una sección con el contenido de [`5-casos-de-uso/especificaciones.md`](../5-casos-de-uso/especificaciones.md): fichas, referencia a la interfaz, diagrama de secuencia del sistema (DSS) y clases de Registrarse, Generar plan, Completar checklist diario, Recuperar contraseña, Verificar integridad y Gestionar familias.

### Diagrama de Clase

Reemplazar el diagrama por el de [`4-backend/diagrama-de-clases.md`](../4-backend/diagrama-de-clases.md). Actualizar el texto: "Respecto de la versión anterior se agregan Patente, Familia y DigitoVerificadorVertical, las clases del patrón Composite (ComponentePermiso, PatenteHoja, FamiliaCompuesta) y las de los demás patrones."

### DER lógico **(nueva)**

Agregar el diagrama de [`3-base-de-datos/der-logico.md`](../3-base-de-datos/der-logico.md).

---

## Secciones nuevas al final del documento

Agregar, antes de **Escalabilidad**, una sección por cada documento (título y resumen; el detalle puede ir como anexo):

1. **Patrones de diseño** → [`4-backend/patrones-de-diseno.md`](../4-backend/patrones-de-diseno.md)
2. **Seguridad** → [`6-calidad/seguridad.md`](../6-calidad/seguridad.md)
3. **Base de datos: backup, particiones e integridad** → [`3-base-de-datos/estrategia-de-datos.md`](../3-base-de-datos/estrategia-de-datos.md)
4. **Pruebas** → [`pruebas/informe-de-pruebas.md`](../pruebas/informe-de-pruebas.md)
5. **Rendimiento** → [`6-calidad/rendimiento.md`](../6-calidad/rendimiento.md)
6. **Despliegue** → [`despliegue.md`](../despliegue.md)
7. **Mantenimiento y sustitución** → [`6-calidad/mantenimiento-y-sustitucion.md`](../6-calidad/mantenimiento-y-sustitucion.md)
8. **Manual de usuario** (como anexo) → [`manual-de-usuario.md`](../manual-de-usuario.md)

---

## Escalabilidad

Marcar como realizado o parcial:

- **Particionado de colecciones.** "Parcial: la bitácora tiene una partición temporal (vencimiento automático de los registros de más de 180 días) e índices por usuario y fecha. El particionado horizontal (sharding por `userId`) requiere un cluster pago de Atlas."
- **Backup automático.** "Parcial: backup y restore multiplataforma en Node, con retención de los últimos 7 y botón en el panel; falta programarlos automáticamente."
- **Caché.** "Parcial: el frontend guarda en caché perfil, plan, permisos y adherencia, y el plan se cachea en el navegador; Redis en el servidor sigue como mejora."
- **Rol de Administrador.** "Realizado: panel con gestión de usuarios, permisos, integridad, bitácora y backup. Falta la moderación de sugerencias (depende de RF15)."
- **Pruebas automatizadas** (Seguridad y Control). "Realizado."
- **Proveedor de IA.** Agregar: "El proveedor de IA ya es intercambiable (Strategy): se puede sumar uno nuevo sin tocar el resto del sistema."
