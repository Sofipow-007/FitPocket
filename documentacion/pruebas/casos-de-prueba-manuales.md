# Casos de prueba manuales

Complementan las pruebas automáticas (`npm test` en `fullStack/backend` y `fullStack/frontend`): cubren lo que una prueba automática no ve bien, como la experiencia en pantalla, el diseño en distintos tamaños, el idioma y el correo real.

**Cómo usar esta tabla.** Correr la app local (`npm run dev` en backend y frontend) o la versión desplegada. Para cada caso, seguir los pasos y completar la columna **Resultado obtenido** con *OK* o con lo que pasó, la fecha y quién lo probó. Si un caso falla, anotar el detalle y abrir un issue.

**Datos de prueba.** Usar cuentas creadas para la prueba (por ejemplo `qa.nombre@fitpocket.test`), nunca cuentas reales. Para los casos de administrador, promover la cuenta con `node scripts/crearAdmin.js <email>` desde `fullStack/backend`.

**Tamaños de pantalla.** Los casos marcados con 📱 se prueban en 390 px (celular) **y** en 1440 px (escritorio).

## Invitado

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| CP-01 | Ver la landing 📱 | Abrir `/` sin sesión. | Se ve la landing completa, sin scroll horizontal. El footer tiene el link "Ayuda". | |
| CP-02 | Registrarse | Ir a `/register`, completar nombre, email y contraseña de 8 caracteres o más, enviar. | Se crea la cuenta y lleva al onboarding. | |
| CP-03 | Registro con datos inválidos | En `/register`, probar: email sin @, contraseña de 5 caracteres, nombre vacío, un email ya registrado. | Cada caso muestra un error claro junto al campo y no crea la cuenta. | |
| CP-04 | Iniciar sesión | Tocar "Entrar" en la landing, ingresar email y contraseña correctos. | Entra al dashboard. | |
| CP-05 | Contraseña incorrecta | En "Entrar", poner una contraseña equivocada. | Muestra "Credenciales inválidas" sin decir si el email existe. | |
| CP-06 | Recuperar la contraseña | "Entrar" → "¿Olvidaste tu contraseña?" → email de la cuenta → abrir el enlace (llega por mail, o sale en la consola del backend si no hay SMTP) → elegir una contraseña nueva. | Entra directo con la contraseña nueva. Con la anterior ya no entra. | |
| CP-07 | Enlace de recuperación usado dos veces | Volver a abrir el mismo enlace del CP-06. | Muestra "Este enlace ya no sirve" con la opción de pedir otro. | |
| CP-08 | Ayuda sin sesión 📱 | Abrir `/ayuda` sin sesión. | Se ven las preguntas de plan, progreso y cuenta. No aparece la sección "Para administradores". | |
| CP-09 | Ruta privada sin sesión | Sin sesión, escribir `/dashboard` en la barra de direcciones. | Redirige a iniciar sesión. | |

## Usuario registrado

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| CP-10 | Onboarding completo 📱 | Recorrer los 4 pasos: datos físicos, objetivo y nivel, días y minutos, dieta, presupuesto y limitaciones. | Cada paso valida antes de avanzar. Al terminar muestra la pantalla de generación del plan. | |
| CP-11 | Generar el plan | Terminar el onboarding con dieta vegetariana y la limitación "rodilla". | En menos de 2 minutos aparece el plan: la rutina solo en los días elegidos, sin ejercicios con salto, y una dieta vegetariana de 7 días. | |
| CP-12 | Ver el plan 📱 | Dashboard → "Ver mi plan". Tocar cada día de la semana. | Cada día muestra su rutina (o descanso) y su dieta. La pantalla abre sin demora. | |
| CP-13 | Cambiar un ejercicio | En el plan, abrir un ejercicio con alternativas y tocar "Cambiar ejercicio" varias veces. | Rota entre las alternativas y vuelve al original. El "?" de al lado explica que el cambio no se guarda. | |
| CP-14 | Checklist del día | Dashboard → pestaña Checklist → marcar rutina y dieta → "Guardar día". | Queda registrado y bloqueado hasta el día siguiente. La adherencia y la racha se actualizan. | |
| CP-15 | Progreso 📱 | Pestaña Progreso. | Muestra las barras de adherencia de la semana y el peso cargado. | |
| CP-16 | Ayudas "?" con teclado | En el dashboard, llegar con Tab al "?" de la adherencia, Enter, después Escape. | Enter abre la explicación (el lector de pantalla la lee), Escape la cierra y el foco vuelve al "?". | |
| CP-17 | "Más en Ayuda" | Abrir el "?" de la racha y tocar "Más en Ayuda". | Abre `/ayuda` con la pregunta de la racha desplegada. "Volver" regresa al dashboard. | |
| CP-18 | Cambiar el idioma 📱 | Tocar EN en el dashboard, recorrer dashboard, plan y ayuda. Recargar la página. | Todo se ve en inglés y después de recargar sigue en inglés. El plan queda en el idioma en que se generó. | |
| CP-19 | Cerrar sesión | Tocar "Salir". Después usar "Atrás" del navegador. | Vuelve a la landing y no se puede volver a ver el dashboard sin entrar. | |
| CP-20 | Borrar la propia cuenta | Progreso → "Tu cuenta" → "Borrar mi cuenta" → confirmar. Intentar entrar con esa cuenta. | Vuelve a la landing. El login de esa cuenta da "Credenciales inválidas". | |
| CP-21 | Cancelar el borrado | Repetir el CP-20 pero tocar "Cancelar" (y probar también Escape). | No se borra nada y el foco vuelve al botón. | |
| CP-22 | Sin conexión con el servidor | Con el backend apagado, recargar el dashboard. | Muestra un mensaje de error de conexión, no una pantalla en blanco. | |
| CP-23 | Usuario común en /admin | Con una cuenta sin permisos de admin, escribir `/admin`. | Redirige al dashboard. El link "Admin" no aparece en el dashboard. | |

## Administrador

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| CP-30 | Entrar al panel 📱 | Con una cuenta admin: dashboard → "Admin". | Se ven las pestañas Usuarios, Familias y permisos, Integridad, Bitácora y Backup. En el celular la pestaña activa queda a la vista. | |
| CP-31 | Buscar y borrar un usuario | Usuarios → buscar por parte del email → "Borrar" → confirmar. | La fila desaparece y se anuncia "Se borró la cuenta de...". Los administradores no tienen botón Borrar. | |
| CP-32 | Crear una familia | Familias y permisos → "Nueva familia" → nombre "Auditor", patentes `bitacora.ver` e `integridad.verificar` → guardar. | Aparece la familia con "2 permisos en total". | |
| CP-33 | Evitar un ciclo | Editar la familia "Usuario". | En "Incluye las familias" no se ofrece "Administrador", porque Administrador ya incluye a Usuario. | |
| CP-34 | Asignar permisos | Elegir un usuario común, marcarle la familia "Auditor", guardar. Con esa cuenta, ir a `/admin`. | La vista previa decía "Va a tener 7 permisos". El usuario ve solo las pestañas Integridad y Bitácora. | |
| CP-35 | Sacar permisos al instante | Sacarle "Auditor" a ese usuario y, sin que cierre sesión, que recargue `/admin`. | Redirige al dashboard: perdió el acceso sin volver a entrar. | |
| CP-36 | No cambiar los permisos propios | En "Permisos de un usuario", elegir la propia cuenta. | Aparece "(vos)" y el aviso de que no se pueden cambiar los propios permisos. | |
| CP-37 | Verificar integridad | Integridad → "Verificar". | Las tres colecciones dan OK. | |
| CP-38 | Detectar una alteración | Con MongoDB Compass (o Atlas), cambiar a mano el peso de un usuario de prueba. Volver a "Verificar". | La tabla marca Usuarios como "Alterada", el DVV calculado distinto del guardado, y lista ese email entre los registros alterados. | |
| CP-39 | Recalcular | Después del CP-38: "Recalcular" → confirmar. | Vuelve a dar todo OK. En la bitácora queda "Recálculo de dígitos verificadores". | |
| CP-40 | Filtrar la bitácora 📱 | Bitácora → filtrar por Resultado "Rechazados (4xx)", después por el email de un usuario, después por un rango de fechas. Pasar de página. | Cada filtro muestra solo lo que corresponde. No aparecen contraseñas ni emails guardados en los detalles. | |
| CP-41 | Generar un backup | Backup → "Generar backup". | Aparece arriba en la lista con fecha, colecciones, documentos y tamaño, marcado como "Último". | |
| CP-42 | Restaurar un backup | En una base de prueba: generar un backup, borrar un usuario de prueba, correr `node scripts/restore.js` y confirmar con "si". | El usuario vuelve y la verificación de integridad da OK. | |
| CP-43 | El admin no puede borrarse | Progreso → "Tu cuenta" con una cuenta admin. | No hay botón de borrar: aparece la nota para pedírselo a otro administrador. | |

## Accesibilidad general

| ID | Caso | Pasos | Resultado esperado | Resultado obtenido |
|---|---|---|---|---|
| CP-50 | Solo con teclado | Recorrer registro, onboarding, dashboard y admin usando solo Tab, Enter, Espacio, flechas y Escape. | Todo se puede usar; el foco siempre se ve; los diálogos no dejan escapar el foco. | |
| CP-51 | Lector de pantalla | Con NVDA (Windows) o VoiceOver (Mac/iPhone), recorrer el dashboard y una pestaña de admin. | Los botones se anuncian con nombre (por ejemplo "Qué es la racha"). Las tablas se leen como tablas, también en celular. | |
| CP-52 | Zoom al 200 % | En escritorio, zoom del navegador al 200 % en dashboard, plan, ayuda y admin. | No se pierde contenido ni aparece scroll horizontal. | |
| CP-53 | Movimiento reducido | Activar "reducir movimiento" en el sistema operativo y recorrer la app. | No hay animaciones de desplazamiento; la pantalla de carga del plan no anima la barra. | |
