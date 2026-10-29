# Rendimiento y optimización

Qué se hizo para que FitPocket cargue rápido y responda rápido, con las mediciones reales. El público usa la app principalmente desde el celular, en el gimnasio o en casa, a veces con datos móviles: cada kilobyte y cada pedido cuentan.

## 1. Frontend

### Carga diferida (lazy loading)

Cada pantalla es un archivo aparte (`React.lazy` en `App.jsx`): quien entra a la página de inicio no descarga el panel de administración ni el detalle del plan. La carga inicial es solo el código común (React, router, traducciones) y la pantalla que se abre.

### Precarga

Mientras el usuario mira el dashboard, el navegador descarga en un momento libre (`requestIdleCallback`) el código de "Ver mi plan". Al tocar el botón la pantalla abre sin esperar la descarga, y el plan ya está en la caché (siguiente punto).

### Caché de datos (`lib/apiCache.js`)

Perfil, plan, permisos y adherencia se guardan en memoria y en `sessionStorage`, con un vencimiento corto (de 1 a 5 minutos según el dato) y atados al token de la sesión.

- **Medido** contra la base real: el dashboard hace 5 pedidos al cargar. Después, ir al plan, volver y recargar con F5 **no hace ningún pedido**.
- Dos pantallas que piden lo mismo a la vez comparten el mismo pedido.
- Se invalida cuando el dato cambia: al guardar un checkin (adherencia), generar un plan (plan y adherencia), completar el onboarding (perfil y plan), entrar, salir o borrar la cuenta.

### Minificación y división en archivos

Vite minifica JavaScript y CSS en el build (`npm run build`). Además, React y el router por un lado, e i18next por otro, van en archivos propios (`vendor-react`, `vendor-i18n`): cambian muy poco, así que después de un despliegue el navegador los sigue teniendo en caché y solo descarga el código de la app que cambió. En Vercel, los archivos de `/assets/` (que llevan un hash en el nombre) se marcan como inmutables por un año.

### Tamaños del build

Medidos con `vite build`:

| | Antes de la optimización | Después |
|---|---|---|
| JavaScript total | 479,9 KB (150,8 KB con gzip) | 484,0 KB (153,7 KB con gzip) |
| CSS total | 122,9 KB (31,4 KB con gzip) | 122,9 KB (31,4 KB con gzip) |
| Carga inicial (gzip) | 117,1 KB | 118,2 KB |
| Archivo más grande | `index` 335,9 KB | `vendor-react` 224,2 KB |
| Código propio de la app en la carga inicial | dentro de `index` | `index` 56,3 KB |
| Archivos de más de 500 KB | ninguno | ninguno |

La división **no reduce el tamaño total** (suma 1 KB del cargador de módulos); lo que gana es que un despliegue nuevo invalida 56 KB en lugar de 336 KB. Las pantallas grandes (dashboard 18,6 KB, admin 42 KB) se descargan solo cuando se abren.

## 2. Backend

| Medida | Efecto |
|---|---|
| `.lean()` en las lecturas que no modifican datos | Mongoose devuelve objetos simples en lugar de documentos completos: menos memoria y menos tiempo por pedido. Incluye la lectura del usuario que hace `auth` en **cada** pedido |
| `select()` con solo los campos necesarios | Menos datos viajando desde Atlas. El perfil, además, ya no devuelve campos internos |
| Compresión gzip (`compression`) | El plan completo viaja en **2,3 KB en lugar de 7,7 KB** (medido) |
| `Cache-Control: private, max-age=60` en `GET /plan/actual` | El navegador reusa el plan por un minuto sin preguntarle al servidor. `private` y `Vary: Authorization` evitan que un proxy o el navegador mezclen el plan de dos cuentas. Después de generar un plan nuevo, el front lo pide salteando esa caché |
| Índices | `plans {userId, estado}`, `checkins {userId, fecha}`, `bitacoras {userId, createdAt}` y TTL en `createdAt` (ver [DER](../3-base-de-datos/der-logico.md#índices)) |
| Bitácora sin `await` | Se escribe después de responder: no suma tiempo al pedido |
| Eventos (Observer) | Las alertas de adherencia y los registros de eventos corren después de responder |

## 3. Prueba de carga

`npm run test:perf` (en `fullStack/backend`) levanta la app con una base en memoria, crea un usuario con plan y una semana de checkins, y le manda carga sostenida con autocannon: **10 conexiones simultáneas durante 10 segundos** por ruta. Cada pedido pasa por todo el camino real: validación del JWT, cálculo de permisos (patentes), la consulta y el registro en la bitácora.

| Ruta | Pedidos/s | p50 | p95 | p99 | Máximo | Errores |
|---|---|---|---|---|---|---|
| `GET /plan/actual` | 297 | 30,2 ms | 51,9 ms | 72,2 ms | 122 ms | 0 |
| `GET /checkins/semana` | 244 | 39,1 ms | 52,5 ms | 79,9 ms | 118,1 ms | 0 |

Criterio: p95 ≤ 200 ms y sin errores → **aprobado**. Entorno: Node 22, computadora de desarrollo con Windows, base en memoria (sin la red hasta Atlas, así se mide la app y no la conexión). El resultado más reciente queda en [`pruebas/rendimiento.md`](../pruebas/rendimiento.md).

La **generación del plan** no entra en esta prueba porque depende de la IA: tarda entre 5 y 60 segundos según el modelo y la carga de Groq.

## 4. Mejoras posibles

- Caché en el servidor (por ejemplo Redis) para los permisos, que hoy se calculan desde la base en cada pedido.
- Instalación como PWA (RNF08) con un *service worker* que guarde el plan para verlo sin conexión.
- Imágenes del logo en formato WebP.
