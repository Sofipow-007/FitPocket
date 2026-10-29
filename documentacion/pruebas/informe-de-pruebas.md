# Informe de pruebas

Qué se prueba en FitPocket, cómo correr las pruebas y qué resultados dieron. Datos al 29 de octubre de 2026.

## Resumen

| | Cantidad | Resultado |
|---|---|---|
| Pruebas automáticas del backend | 103 | 103 aprobadas |
| Pruebas automáticas del frontend | 25 | 25 aprobadas |
| Cobertura del backend (líneas) | 85,6 % | (sentencias 83,3 %, funciones 84,2 %, ramas 69,3 %) |
| Prueba de rendimiento | 2 rutas | Aprobada (p95 de 52 ms y 53 ms; umbral 200 ms) |
| Casos de prueba manuales | 40 | Para completar por el equipo |

## Cómo correrlas

```bash
# Backend
cd fullStack/backend
npm test                  # las 103 pruebas
npm run test:cobertura    # con el informe de cobertura (queda en coverage/)
npm run test:perf         # prueba de rendimiento (escribe documentacion/pruebas/rendimiento.md)

# Frontend
cd fullStack/frontend
npm test                  # las 25 pruebas
npm run test:watch        # modo interactivo mientras se programa
```

Las pruebas del backend **no necesitan Atlas, Groq ni ninguna clave**: levantan una base MongoDB en memoria (`mongodb-memory-server`, que la primera vez descarga un binario de ~100 MB), usan una estrategia de IA falsa que devuelve un plan fijo y simulan el envío de mails. Se pueden correr sin internet una vez descargado ese binario.

## Herramientas

| Herramienta | Para qué |
|---|---|
| Jest | Corre las pruebas del backend |
| Supertest | Hace pedidos HTTP a la app de Express sin levantar un puerto (por eso `app.js` está separado de `index.js`) |
| mongodb-memory-server | Base MongoDB real pero en memoria, nueva para cada archivo de pruebas |
| Vitest + Testing Library + jsdom | Pruebas del frontend: renderizan componentes en un navegador simulado y los usan como una persona (rol, nombre accesible, teclado) |
| autocannon | Prueba de carga |
| GitHub Actions | Corre todo en cada push y pull request |

## Qué se prueba

### Backend

| Archivo | Pruebas | Tipo | Qué cubre |
|---|---|---|---|
| `unitarias.test.js` | 13 | Unitarias | Encriptación AES (ida y vuelta, IV aleatorio, valores sin cifrar, cifrado alterado), dígitos verificadores (determinismo, orden de los campos, DVV), filtro de ejercicios contraindicados y normalización de días |
| `patrones.test.js` | 16 | Unitarias + integración | Factory de IA (proveedor válido, inválido con mensaje claro), estrategias Groq y Ollama, factory de mails, estrategias de adherencia (7 y 30 días, cálculo, racha, días previos al plan), Singleton de la conexión, Observer (un suscriptor que falla no frena a los otros; los eventos llegan a la bitácora; una sola alerta por día) |
| `flujos.test.js` | 9 | Integración | Registro → onboarding vegetariana con limitación de rodilla → plan (solo días elegidos, sin saltos, datos de salud cifrados) → checkin → adherencia; plan sin onboarding; IA caída (503 sin plan a medias); segundo plan archiva el anterior; recuperación de contraseña (un solo uso, vencida, cierra sesiones, respuesta igual exista o no la cuenta); administración de usuarios |
| `seguridad.test.js` | 26 | Seguridad | 401 en las 9 rutas privadas sin token; token mal formado, de otra clave, vencido o sin "Bearer"; cuenta borrada; token anterior al cambio de contraseña; rol falso en el token; inyección NoSQL en login, recuperación y restablecimiento; filtro de bitácora con expresión regular; validaciones de registro y checkin; JSON mal formado; pedido sin cuerpo; el perfil no expone hashes |
| `permisos.test.js` | 9 | Unitarias + integración | Composite (unión de patentes, ciclos), registro con familia Usuario, 403 sin patente, admin con acceso, quitar Administrador saca el acceso al instante, rechazo de ciclos al editar, un admin no cambia sus propios permisos |
| `integridad.test.js` | 6 | Integración | DVH con el nombre descifrado, DVH y DVV al día en save, findOneAndUpdate y updateMany; un peso editado a mano se detecta y Recalcular lo deja OK; una fila borrada por fuera cambia el DVV; 403 sin patente |
| `bitacoraBackup.test.js` | 8 | Integración | Bitácora paginada y filtrada (resultado, email), lista de acciones, 403, **no guarda contraseñas ni emails**; backup → borrar un usuario → restore → vuelve con su mismo id y la integridad da OK; retención; nombre de backup con `../` rechazado |
| `cuenta.test.js` | 3 | Integración | Borrar la propia cuenta (con planes y checkins, y el token deja de servir); un admin no puede borrarse; 403 sin patente |
| `despliegue.test.js` | 13 | Unitarias + integración | Variables obligatorias, reglas de producción (claves cortas, iguales o publicadas), orígenes de CORS, CORS permite el front y bloquea otros sitios, `/salud` fuera de la bitácora, re-cifrado de datos (simulación, migración, repetible, valores ilegibles, 1000 casos con la clave equivocada) |

### Frontend

| Archivo | Pruebas | Qué cubre |
|---|---|---|
| `src/test/i18n.test.js` | 3 | `es.json` y `en.json` tienen exactamente las mismas claves, ningún texto vacío y las mismas variables `{{...}}` |
| `src/lib/apiCache.test.js` | 10 | Caché: segundo pedido desde la caché, pedidos simultáneos compartidos, otro token no reusa datos, invalidación con `cache: "reload"`, 404 sí se guarda y errores no, vencimiento, sessionStorage |
| `src/components/componentes.test.jsx` | 12 | `<ConPermiso>` (muestra, oculta, mientras carga, sin sesión); `<AyudaTip>` (clic, teclado con Enter y Escape, foco devuelto, clic afuera, `role="status"`, link a la ayuda); `<DialogoConfirmacion>` (nombre y descripción accesibles, foco inicial, Escape, foco atrapado con Tab, estado ocupado, error) |

### Rendimiento

Ver [`rendimiento.md`](rendimiento.md) (resultado de la última corrida) y [rendimiento y optimización](../6-calidad/rendimiento.md#3-prueba-de-carga) (metodología).

### Manuales

[`casos-de-prueba-manuales.md`](casos-de-prueba-manuales.md): 40 casos para invitado, usuario, administrador y accesibilidad (teclado, lector de pantalla, zoom al 200 %, movimiento reducido), con una columna para anotar el resultado obtenido.

## Errores que encontraron las pruebas

Las pruebas no solo confirmaron lo que funcionaba: encontraron estos errores, que se corrigieron.

| Error | Cómo se encontró | Corrección |
|---|---|---|
| Login con `{"password": {"$ne": null}}` respondía 500 (bcrypt fallaba con un objeto) | Prueba de inyección NoSQL | Se valida que email y contraseña sean texto; responde 400 |
| Un pedido sin cuerpo JSON respondía 500 en registro y login | Prueba de validaciones | `req.body` vacío se trata como `{}` |
| El plan generado se imprimía completo en los logs (datos de salud) | Al revisar la salida de la prueba de rendimiento | Se registra solo el id del plan |
| Las colecciones vacías daban "DVV distinto" | Prueba de integridad | Una colección sin DVV guardado se compara contra 0 |
| Seis errores de lint y una barra perdida en una expresión regular de `vite.config.js` | Al preparar el workflow de CI (que corre el lint completo) | Se corrigió la expresión |

Para comprobar que las pruebas de seguridad detectan de verdad los errores, se deshicieron temporalmente las dos primeras correcciones: las pruebas correspondientes fallaron, y volvieron a pasar al restaurarlas.

## Integración continua

`.github/workflows/tests.yml` corre en cada push y pull request a `development` y `main`:

| Trabajo | Pasos | ¿Frena el merge si falla? |
|---|---|---|
| Backend | `npm ci` → `npm run test:cobertura` | Sí |
| Frontend | `npm ci` → `npm run lint` → `npm test` → `npm run build` | Sí |
| Rendimiento | `npm run test:perf`; guarda el resultado como artefacto | No: las máquinas compartidas de GitHub varían mucho en velocidad; el umbral se valida en local |

## Observaciones

- En una de muchas corridas del backend en Windows fallaron varias pruebas a la vez y no se repitió en las siguientes cinco; coincide con varias bases en memoria arrancando en paralelo. Si aparece en CI, se puede limitar la cantidad de procesos de Jest (`--maxWorkers`).
- La generación real del plan con Groq no tiene prueba automática (depende de un servicio externo y gasta cuota); se verificó a mano durante el desarrollo, y la lógica alrededor (prompts, filtros, reintentos, errores) sí está probada con la IA simulada.
