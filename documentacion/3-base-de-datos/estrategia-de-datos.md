# Base de datos: backup, particiones e integridad

## 1. Backup y restore

### Qué hace

| Herramienta | Cómo se usa | Qué hace |
|---|---|---|
| `scripts/backup.js` | `node scripts/backup.js` (desde `fullStack/backend`) | Exporta **todas** las colecciones a `backups/backup_AAAA-MM-DD_HH-MM-SS/<coleccion>.json` y escribe un `manifest.json` con la cantidad de documentos de cada una |
| Botón **Generar backup** | Panel `/admin` → pestaña Backup (patente `backup.ejecutar`) | Lo mismo, desde la web. Lista los backups disponibles |
| `scripts/restore.js` | `node scripts/restore.js [backup_FECHA] [--si]` | Restaura un backup (el último si no se indica). Pide confirmación escribiendo "si" |
| `scripts/backup.sh` / `restore.sh` | Alternativa con `mongodump` / `mongorestore` | Requieren bash y las herramientas de MongoDB instaladas |

Decisiones de diseño:

- **En Node y no con `mongodump`.** Los scripts anteriores (`.sh`) necesitaban bash y las *MongoDB Database Tools*, que no vienen en un Windows común. Los nuevos usan el mismo driver que la app y corren en cualquier sistema donde corra el backend.
- **Formato EJSON canónico.** JSON común perdería los tipos: un `ObjectId` volvería como texto y una fecha como string. EJSON los guarda como `{"$oid": ...}` y `{"$date": ...}`, así que un restore deja los datos exactamente como estaban, con los mismos `_id` (las referencias entre colecciones siguen valiendo).
- **El restore vacía y recarga solo las colecciones del backup**, con `deleteMany` y no `drop`, así se conservan los índices (incluido el TTL de la bitácora y los únicos).
- **Al terminar, el restore recalcula los dígitos verificadores.** Los DVV guardados pueden no coincidir con lo restaurado; sin el recálculo, la verificación de integridad marcaría alteraciones que en realidad son el restore.
- **El restore no tiene botón en la web a propósito.** Reemplaza el contenido de toda la base: es una operación que se hace con acceso al servidor y conscientemente, no con un clic.
- **Los nombres de backup se validan** (`backup_` + fecha): un nombre como `../../etc` se rechaza antes de tocar el disco.

### Estrategia sugerida

| Aspecto | Valor |
|---|---|
| Frecuencia | Semanal, y siempre antes de un despliegue que cambie modelos o antes de correr `recifrar.js` |
| Retención | Los últimos 7 (variable `BACKUP_RETENCION`): al generar el octavo se borra el más viejo |
| Dónde | `fullStack/backend/backups/` (variable `BACKUP_DIR`). La carpeta está en `.gitignore`: tiene datos de usuarios |
| Copia externa | Copiar el último backup fuera de la máquina (por ejemplo, el Drive del equipo) |
| Prueba de restore | Restaurar periódicamente en una base de prueba y verificar integridad. Así se probó: backup de la base real (7 colecciones, 790 documentos), restore en `fitpocket_restore_prueba`, borrado de un usuario, segundo restore → el usuario volvió y la integridad dio OK |

En el plan gratuito de Render el disco del servidor se borra en cada despliegue, por eso en producción los backups se hacen desde una computadora del equipo (ver [`despliegue.md`](../despliegue.md#7-backups-en-producción)).

## 2. Particiones y optimización

### Índices

Ver la tabla en [`der-logico.md`](der-logico.md#índices). Los dos índices compuestos nuevos cubren las consultas más frecuentes: "el plan activo de este usuario" y "la bitácora de este usuario ordenada por fecha".

### Partición temporal de la bitácora (TTL)

La bitácora es la colección que más crece: registra cada pedido a la API. Tiene un **índice TTL** sobre `createdAt`: MongoDB borra solo, en segundo plano, los registros con más de `BITACORA_TTL_DIAS` días (180 por defecto). Funciona como una partición por tiempo: la colección conserva una ventana móvil de los últimos seis meses, sin tareas programadas.

Si se cambia `BITACORA_TTL_DIAS`, el backend ajusta el índice existente al arrancar (`collMod`), porque MongoDB no permite recrear un índice con otro vencimiento.

### Partición horizontal (sharding)

El *sharding* reparte una colección entre varios servidores según una clave. Para FitPocket la clave natural sería `userId` en `plans`, `checkins` y `bitacoras`: todas las consultas de un usuario caerían en el mismo servidor.

**No está implementado:** Atlas solo permite sharding en clusters dedicados (M30 en adelante, pagos). El cluster gratuito M0 tiene un solo servidor y 512 MB. Con los índices actuales y la ventana de 180 días de la bitácora, el volumen previsto para el proyecto entra con holgura. El diseño de colecciones ya es compatible: todas las consultas filtran por `userId`, así que activarlo no requeriría cambiar código.

## 3. Verificación de integridad (dígitos verificadores)

### DVH: dígito verificador horizontal

Cada documento de `users`, `plans` y `checkins` guarda un `dvh` calculado a partir de sus campos importantes. Si alguien cambia uno de esos campos por fuera de la app (por ejemplo, editando la base en Atlas), el DVH guardado deja de coincidir con el que se calcula.

| Colección | Campos que entran al DVH |
|---|---|
| `users` | email, nombre (descifrado), rol, peso, altura, edad |
| `plans` | userId, estado, version, calorías objetivo por día |
| `checkins` | userId, fecha, estado de la rutina, estado de la dieta, puntaje total |

**Cálculo:** los campos se unen como texto separados por `|` y se suma el código de cada carácter multiplicado por su posición; el resultado se toma módulo 10000. Multiplicar por la posición hace que importe el orden: intercambiar dos campos cambia el dígito.

El nombre entra **descifrado**: se guarda cifrado con un vector de inicialización aleatorio, así que el mismo nombre se ve distinto cada vez que se guarda; si entrara cifrado, el DVH cambiaría en cada escritura.

La lista de campos está definida en un solo lugar (`camposDVH` en `utils/digitosVerificadores.js`) y la usan el cálculo al guardar, la verificación y el recálculo.

### DVV: dígito verificador vertical

La colección `digitosverificadoresverticales` guarda un DVV por colección: la suma de todos los DVH, módulo 100000. Detecta lo que el DVH no puede ver: **filas agregadas o borradas** por fuera de la app.

### Cuándo se calculan

Un **plugin de Mongoose** (`models/plugins/digitosVerificadores.js`) los mantiene solos en cada escritura, sin que cada controlador tenga que acordarse:

- `save` / `create` → calcula el DVH del documento.
- `findOneAndUpdate`, `updateOne`, `updateMany` → anota qué documentos va a tocar y después recalcula sus DVH (con el driver nativo, para no volver a disparar el plugin).
- Cualquier alta, cambio o baja → recalcula el DVV de la colección. Los recálculos de una misma colección se encadenan para que dos escrituras simultáneas no guarden una suma vieja.

### Verificar y recalcular

| | Endpoint | Patente | Qué hace |
|---|---|---|---|
| Verificar | `GET /integridad/verificar` | `integridad.verificar` | Recalcula el DVH de cada documento (no confía en el guardado), lista los alterados y compara la suma con el DVV guardado |
| Recalcular | `POST /integridad/recalcular` | `integridad.recalcular` | Recalcula y guarda todos los DVH y DVV. Acepta los datos actuales como válidos: se usa después de revisar una alteración, de una migración o de un restore |
| Script | `node scripts/recalcularDigitos.js` | — | Lo mismo por consola (se corrió una vez sobre los datos existentes al implementar esto) |

Respuesta de la verificación, por colección:

```json
{
  "coleccion": "users",
  "totalRegistros": 8,
  "filasAlteradas": [{ "id": "6ae2...", "coleccion": "users", "referencia": "usuario@ejemplo.com", "dvhGuardado": 9867, "dvhCalculado": 5778 }],
  "dvvGuardado": 37383,
  "dvvCalculado": 33294,
  "ok": false
}
```

Cuando la verificación encuentra problemas se emite el evento `integridad.alterada`, que queda en la bitácora.

**Prueba realizada sobre la base real:** se cambió a mano el peso de un usuario de prueba con el driver de MongoDB (sin pasar por la app). "Verificar" marcó ese usuario como alterado y el DVV de `users` como distinto; "Recalcular" lo dejó en OK.
