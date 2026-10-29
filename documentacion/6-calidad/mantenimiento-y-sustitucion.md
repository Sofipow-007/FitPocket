# Mantenimiento y sustitución

Plan para seguir desarrollando FitPocket: qué falta, cómo mantener las dependencias al día y qué piezas se pueden reemplazar sin reescribir el resto.

## 1. Plan de mejoras

Los requisitos pendientes de la documentación principal, ordenados por valor para el usuario y por esfuerzo estimado. El esfuerzo es orientativo (S: un par de días, M: una semana, L: más).

| Prioridad | Mejora | Requisito | Esfuerzo | Qué ya existe |
|---|---|---|---|---|
| 1 | Pantalla de perfil: ver y editar datos físicos y preferencias | RF13, CU10 | S | El backend ya permite consultar y actualizar (`GET /users/perfil`, `PUT /users/actualizar`) |
| 2 | Registro de peso diario al completar el checklist | RF07, CU13 | M | El checkin se guarda por día; falta el campo y la pantalla |
| 3 | Gráfico de evolución del peso | RF09 | S (después del 2) | La pestaña Progreso ya tiene el lugar |
| 4 | Mostrar la adherencia mensual | RF08 | S | El backend ya la calcula (`GET /checkins/mes`, estrategia mensual) |
| 5 | Regenerar el plan desde la interfaz | RF12, CU17 | S | `POST /plan/generar` ya archiva el anterior |
| 6 | Notificaciones push y criterio de 60% en 72 horas | RF10, CU15 | M | El evento `checkin.registrado` y el suscriptor de alertas ya existen: se agrega otro suscriptor |
| 7 | Regeneración automática del plan por baja adherencia | RF11, CU16 | M | Se puede hacer como otro suscriptor del mismo evento |
| 8 | Instalación como PWA | RNF08 | M | Vite tiene un plugin para PWA |
| 9 | Exportar el progreso como imagen PNG | RF14, CU18 | M | — |
| 10 | Sección de sugerencias, con moderación desde el panel | RF15, CU19 | M | El panel y las patentes permiten agregar una pestaña nueva con su permiso |
| 11 | Calculadora de IMC para invitados | RF04, CU02 | S | El cálculo ya está en el onboarding |
| 12 | Incrementar el número de versión de cada plan | RNF09 | S | Los planes anteriores ya se archivan |

Mejoras técnicas:

- **Programar el backup** (por ejemplo, con una tarea programada de GitHub Actions o de Render) en lugar de hacerlo a mano.
- **Rate limiting** en login y recuperación de contraseña.
- **Autenticación de dos factores** para administradores.
- **Caché de permisos en el servidor**, si la cantidad de usuarios crece.

## 2. Actualización de dependencias

### Cómo

1. Una vez por mes, en cada carpeta (`fullStack/backend` y `fullStack/frontend`):
   ```bash
   npm outdated      # qué hay nuevo
   npm audit         # vulnerabilidades conocidas
   ```
2. Actualizar en una rama aparte. Las versiones menores y de parche (`npm update`) son seguras de aplicar juntas; las **mayores** (el primer número cambia) van **de a una**, leyendo las notas de la versión.
3. Correr `npm test` (y `npm run build` en el frontend). Las pruebas automáticas existen justamente para esto: si pasan, la actualización no rompió lo que está probado. El workflow de GitHub Actions lo vuelve a correr en el pull request.
4. Hacer un recorrido rápido de los [casos de prueba manuales](../pruebas/casos-de-prueba-manuales.md) principales.

### Dependencias sensibles

| Dependencia | Por qué hay que mirarla con cuidado |
|---|---|
| `mongoose` | Cambios en hooks o en `findOneAndUpdate` afectan al plugin de dígitos verificadores. Las pruebas de integridad lo cubren |
| `express` | El proyecto ya usa Express 5; el manejo de errores asíncronos y de `req.body` cambió respecto de la 4 |
| `jsonwebtoken`, `bcrypt` | Seguridad: actualizar ante cualquier aviso de `npm audit` |
| `groq-sdk` | Si cambia la forma de la respuesta, solo hay que tocar `GroqStrategy` |
| `react`, `react-router-dom`, `vite` | Las mayores suelen traer cambios de API; la de Vite puede cambiar la configuración de `vite.config.js` |
| `mongodb-memory-server` | Descarga un binario de MongoDB (~100 MB) en la primera corrida de pruebas; una versión nueva puede pedir otro |

## 3. Componentes sustituibles

Piezas que se pueden reemplazar tocando un solo lugar, gracias a cómo está armado el código.

| Componente | Hoy | Cómo se reemplaza | Qué se toca |
|---|---|---|---|
| **Proveedor de IA** | Groq (`openai/gpt-oss-120b`) | Patrón Strategy + Factory Method: escribir una clase que extienda `EstrategiaIA` con `completar(mensajes, temperatura)` y agregarla a la tabla de `iaFactory.js` | Un archivo nuevo y una línea. Ya existe `OllamaStrategy` como alternativa (`IA_PROVIDER=ollama`) |
| **Modelo de IA** | `openai/gpt-oss-120b` | Variable `GROQ_MODEL` (o `OLLAMA_MODEL`) | Solo configuración |
| **Envío de mails** | SMTP con Nodemailer | Cualquier servidor SMTP (Gmail, Brevo, el del hosting) se configura con variables. Para una API (SendGrid, Resend), cambiar la función `enviar` de `mailService.js`; los textos (`crearMail`) no cambian | Configuración, o una función |
| **Notificaciones** | Alerta en la bitácora y mail | Observer: agregar un suscriptor al evento `checkin.registrado` (por ejemplo, push) en `services/suscriptores/` | Un archivo nuevo y una línea en `suscriptores/index.js` |
| **Base de datos** | MongoDB Atlas M0 | Cualquier MongoDB (otro cluster de Atlas, uno propio, uno local) cambiando `MONGODB_URI`. Para moverse: `backup.js` y después `restore.js` contra la base nueva | Solo configuración |
| **Hosting del backend** | Render (preparado) | Railway, Fly.io o cualquier servidor con Node 22 o Docker (`Dockerfile` incluido). Definir las mismas variables de entorno | Solo configuración ([despliegue](../despliegue.md#9-alternativas)) |
| **Hosting del frontend** | Vercel (preparado) | Netlify, GitHub Pages, Cloudflare Pages o cualquier hosting estático, con la regla de redirigir todo a `index.html` | Un archivo de configuración del hosting |
| **Período de la adherencia** | Semanal (y mensual en el backend) | Strategy: una clase nueva que extienda `EstrategiaAdherencia` con su cantidad de días | Un archivo nuevo |
| **Permisos** | 12 patentes, 2 familias base | Se crean familias desde el panel, sin código. Una patente nueva se agrega a `PATENTES_BASE` en `permisosService.js` y se usa con `requierePatente('codigo')` en la ruta | Datos, o dos líneas |
| **Idiomas** | Español e inglés | Agregar `src/i18n/<idioma>.json` y registrarlo en `i18n.js`. La prueba de traducciones verifica que tenga las mismas claves | Un archivo y una línea |

## 4. Para quien continúe el proyecto

- Leer primero `README.md` (cómo correrlo) y [`despliegue.md`](../despliegue.md).
- Antes de cambiar algo, correr `npm test` en las dos carpetas para tener una línea de base.
- Cada patrón está marcado en el código con un comentario que empieza con "Patrón"; el porqué de cada decisión está en los mensajes de commit (`git log`).
- Los cambios que tocan modelos pueden requerir `node scripts/recalcularDigitos.js` si cambian los campos que entran al DVH (`camposDVH` en `utils/digitosVerificadores.js`).
