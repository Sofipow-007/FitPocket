# Seguridad

Resumen de las medidas de seguridad de FitPocket, qué protege cada una y dónde está en el código. Todas tienen pruebas automáticas (`fullStack/backend/tests/seguridad.test.js` y otras; ver el [informe de pruebas](../pruebas/informe-de-pruebas.md)).

## 1. Encriptación

### Reversible: AES-256-CBC

Para datos que la app necesita volver a leer.

| Qué se cifra | Por qué |
|---|---|
| Nombre del usuario | Dato personal identificable |
| Limitaciones físicas (`perfil.limitaciones`) | Dato de salud |
| Aclaración del onboarding (`perfil.aclaracion`) | Texto libre que puede contener datos de salud |

- **Cómo:** `utils/crypto.js`. La clave AES de 32 bytes se deriva de la variable `CRYPTO_KEY` con SHA-256. Cada valor se cifra con un **vector de inicialización (IV) aleatorio**, así que el mismo nombre se ve distinto cada vez que se guarda: alguien con acceso a la base no puede saber qué usuarios tienen la misma limitación comparando los textos cifrados. Se guarda como `iv:texto_cifrado` en hexadecimal.
- **La clave es obligatoria.** Antes, si faltaba `CRYPTO_KEY`, se usaba una clave por defecto escrita en el código (y por lo tanto pública). Ahora el backend no arranca sin ella, y en producción rechaza la clave conocida.
- **Cambio de clave:** `scripts/recifrar.js` pasa todos los datos de la clave anterior a la nueva (con modo simulación, confirmación y la posibilidad de correrlo más de una vez). Ver [despliegue](../despliegue.md).
- **El email no se cifra:** se usa para buscar la cuenta al iniciar sesión y tiene un índice único. Cifrarlo con IV aleatorio impediría buscarlo.

### Irreversible: hashes

Para datos que la app solo necesita **comprobar**, nunca leer.

| Qué | Algoritmo | Detalle |
|---|---|---|
| Contraseña | bcrypt (costo 10) | bcrypt agrega una sal distinta por usuario y es lento a propósito: probar millones de contraseñas contra un hash robado lleva mucho tiempo. La contraseña nunca se guarda ni se registra (RNF01) |
| Token de recuperación de contraseña | SHA-256 | El mail lleva un token aleatorio de 32 bytes; en la base queda solo su hash. Si alguien lee la base, no puede usar los enlaces pendientes. Vence a los 30 minutos y se borra al usarse |

## 2. Autenticación y sesiones

- **JWT de 7 días** firmados con `JWT_SECRET` (obligatoria; en producción, 32 caracteres o más).
- En cada pedido el middleware `auth` además de validar la firma **consulta la base**: si la cuenta fue borrada, o si el token es anterior al último cambio de contraseña (`passwordCambiadaEn`), responde 401. Así, recuperar la contraseña cierra todas las sesiones abiertas.
- El **rol que viaja en el token no se usa** para autorizar: un token modificado con `rol: "admin"` no da acceso a nada (hay una prueba que lo verifica).

## 3. Control de acceso: patentes y familias

Cada ruta protegida declara la patente que necesita (`requierePatente('usuarios.borrar')`). Los permisos efectivos se calculan en cada pedido recorriendo las familias del usuario con el patrón Composite (ver [patrones](../4-backend/patrones-de-diseno.md#composite)).

| Nivel de acceso | Familia | Patentes |
|---|---|---|
| Invitado | — | Solo rutas públicas: registro, login, recuperación, salud |
| Usuario | Usuario | `plan.ver`, `plan.generar`, `checkin.registrar`, `perfil.editar`, `cuenta.borrar` |
| Administrador | Administrador (incluye Usuario) | las de Usuario + `usuarios.listar`, `usuarios.borrar`, `bitacora.ver`, `integridad.verificar`, `integridad.recalcular`, `backup.ejecutar`, `familias.gestionar` |
| A medida | La que defina un administrador (por ejemplo "Auditor") | Cualquier combinación |

Reglas que protegen al propio sistema:

- Un administrador **no puede borrar a otro administrador** ni **su propia cuenta**, y **no puede cambiar sus propios permisos**: el sistema nunca queda sin nadie que lo administre.
- Una familia **no puede contenerse a sí misma** (se rechaza al guardar y el recorrido corta los ciclos igual).
- **Quitar un permiso rige en el momento:** no hace falta esperar a que venza el JWT.
- El frontend oculta los botones sin permiso (`<ConPermiso>`), pero **el que decide siempre es el backend**: una llamada directa a la API sin la patente recibe 403.

## 4. Integridad de los datos: DVH y DVV

Cada usuario, plan y checkin tiene un dígito verificador horizontal, y cada colección uno vertical. Detectan modificaciones, altas y bajas hechas por fuera de la app. Detalle en [estrategia de datos](../3-base-de-datos/estrategia-de-datos.md#3-verificación-de-integridad-dígitos-verificadores).

## 5. Bitácora (auditoría)

- Registra **cada pedido a la API** (acción, método, ruta, usuario, IP, código de resultado) y los **eventos de negocio** (plan generado, checkin registrado, usuario borrado, integridad alterada, alerta de adherencia).
- **No guarda contraseñas ni emails**: identifica al usuario por su id, y en los errores guarda solo el mensaje fijo del backend, nunca el cuerpo del pedido. El email que se ve en el panel se toma de la cuenta al consultar. Hay una prueba que revisa que ninguna contraseña ni email aparezca en la bitácora.
- Se consulta desde el panel con la patente `bitacora.ver`. El filtro por email escapa la expresión regular (buscar `.*` no devuelve todo).
- Los registros vencen a los 180 días (índice TTL).
- Detrás del proxy de Render se usa `trust proxy`, así la IP registrada es la del usuario y no la del proxy.

## 6. Entrada de datos

| Riesgo | Medida |
|---|---|
| Inyección NoSQL (`{"email": {"$ne": null}}`) | Email y contraseña se aceptan solo si son texto; cualquier otro tipo responde 400 antes de consultar la base. Probado en login, recuperación y restablecimiento |
| Valores inválidos | Validación de email, largo de contraseña, estados del checkin y ObjectId en las rutas con `:id` |
| JSON mal formado | Responde 400 `{"error": "JSON inválido"}` sin mostrar la traza del error |
| Pedido sin cuerpo | Se trata como cuerpo vacío (400 con el motivo), no como error interno |
| Enumeración de cuentas | "Olvidé mi contraseña" responde lo mismo exista o no el email, y como mucho un mail por minuto por cuenta |
| Nombres de archivo en el restore | Se validan contra el formato `backup_FECHA` (no se acepta `../`) |

## 7. Configuración y despliegue

- **Variables obligatorias:** sin `MONGODB_URI`, `JWT_SECRET` o `CRYPTO_KEY` el backend no arranca (`config/entorno.js`). En producción exige además `FRONTEND_URL`, claves de 32 caracteres o más, distintas entre sí y que no sean las de ejemplo.
- **CORS restringido:** el navegador solo acepta respuestas para el origen configurado en `FRONTEND_URL` (antes cualquier sitio podía llamar a la API).
- **Secretos fuera del repositorio:** `.env` y `backups/` están en `.gitignore`; las claves de Groq y SMTP solo viven en el backend.
- **Datos de salud fuera de los logs:** el plan generado ya no se imprime completo en la consola del servidor, solo su id.
- **Imagen Docker** de producción con un usuario sin privilegios y sin dependencias de desarrollo.

## Pendiente

- Autenticación de dos factores (2FA).
- Limitar la cantidad de intentos de login por IP (*rate limiting*).
- Rotación periódica de `JWT_SECRET` (hoy cambiarla cierra todas las sesiones).
