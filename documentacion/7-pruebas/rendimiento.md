# Prueba de rendimiento

Generado por `npm run test:perf` (fullStack/backend) el 2026-10-29.

- Entorno: Node v22.19.0, Intel(R) Core(TM) i5-10400 CPU @ 2.90GHz, Mongo en memoria. Sin red de por medio: mide la app y la base, no la conexión a Atlas.
- Carga: 10 conexiones simultáneas durante 10 s por ruta, con un usuario que tiene plan y 7 checkins.
- Cada pedido pasa por todo lo real: JWT, consulta de permisos (patentes), la consulta en sí y el registro en la bitácora.
- Criterio: p95 ≤ 200 ms y sin errores.

| Ruta | req/s | p50 (ms) | p95 (ms) | p99 (ms) | máx (ms) | Errores | Resultado |
|---|---|---|---|---|---|---|---|
| GET /plan/actual | 297 | 30.2 | 51.9 | 72.2 | 122 | 0 | OK |
| GET /checkins/semana | 244 | 39.1 | 52.5 | 79.9 | 118.1 | 0 | OK |
