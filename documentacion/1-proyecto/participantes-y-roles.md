# Participantes y roles

| Integrante | Rol en el proyecto |
|---|---|
| Thomas Barrera Fuentes | `[COMPLETAR]` |
| Mauro Beltran | `[COMPLETAR]` |
| Lautaro Palombo | `[COMPLETAR]` |
| Sofia Power | `[COMPLETAR]` |

**Los roles los define el equipo.** Lo que sigue es solo una sugerencia para empezar la conversación, armada a partir de quién hizo cada commit y qué carpetas tocó. Tiene límites importantes:

- **Un commit no mide el trabajo.** El análisis, el diseño en papel, la documentación en Word, las pruebas manuales, el debate y la coordinación no dejan commits, o quedan a nombre de quien los subió.
- **Varios integrantes usaron más de una identidad de git** (por ejemplo desde las computadoras del laboratorio, como "L6 - PC 12"). Acá se agruparon por email.
- **Los commits de la consigna final** (rama `feature/consigna-final`, octubre de 2026) figuran a nombre de Mauro Beltran porque se hicieron con su usuario de git, con asistencia de una herramienta de IA (Claude) que los co-firma. Para que la comparación sea justa, la tabla cuenta solo los commits que ya estaban en `development` antes de esa rama.

## Datos de los commits

Commits en `development` (sin merges), agrupados por email, al 29 de octubre de 2026:

| Integrante | Commits | Período | Carpetas más tocadas | Temas frecuentes |
|---|---|---|---|---|
| Mauro Beltran | 112 | 16/04 – 08/10 | `frontend/src` (la mayor parte), `backend/controllers`, `documentacion`, `backend/models` | Rediseño de pantallas (home, onboarding, dashboard, plan), recuperación de contraseña, panel de admin, documentación |
| Sofia Power | 41 | 18/03 – 02/09 | `backend/controllers`, `backend/services`, `backend/models`, `backend/routes` | Estructura inicial del backend, modelo de usuario y CRUD, generación de planes (primero con n8n, después con el backend propio) |
| Lautaro Palombo | 5 (7 en todas las ramas) | 09/04 – 27/05 | `backend/controllers`, `backend/routes`, `frontend/src` | Onboarding del lado del backend, correcciones del backend junto con Sofia |
| Thomas Barrera Fuentes | 1 (15 en todas las ramas) | 23/04 – 28/05 | `README.md`, `frontend/src` | README del proyecto, ajustes del navbar |

## Roles sugeridos

Solo como punto de partida; puede que no reflejen cómo se repartió el trabajo de verdad:

| Integrante | Rol sugerido |
|---|---|
| Mauro Beltran | Desarrollo frontend y diseño de interfaz; integración frontend-backend; documentación técnica |
| Sofia Power | Desarrollo backend: arquitectura inicial, modelos y servicios; integración con la IA |
| Lautaro Palombo | Desarrollo backend (onboarding y controladores); soporte y corrección de errores |
| Thomas Barrera Fuentes | Documentación del repositorio (README) y apoyo en el frontend |

Si alguien tuvo roles que no se ven en el código (por ejemplo análisis de requisitos, pruebas manuales, presentación o coordinación), conviene sumarlos a la tabla de arriba.

## Cómo se obtuvieron los datos

```bash
git shortlog -sne --all                                        # commits por persona e identidad
git log development --no-merges --author="<email>" --oneline   # commits de cada uno en development
git log development --no-merges --author="<email>" --name-only --format=   # archivos que tocó
```
