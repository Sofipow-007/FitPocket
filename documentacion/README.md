# Documentación de FitPocket

Las carpetas están numeradas en el orden sugerido de lectura. El nombre sin sufijo es siempre la versión vigente; las versiones anteriores están en `historico/` con su fecha.

| Carpeta | Contenido |
|---|---|
| `1-proyecto/` | Documentación principal y lista de haceres del equipo |
| `2-diseno/` | Capturas de las pantallas actuales y logos |
| `3-base-de-datos/` | Modelo de datos, esquema y datos de ejemplo |
| `4-backend/` | Apunte sobre la estructura del backend, diagrama de clases y patrones de diseño |
| `5-casos-de-uso/` | Diagrama general y especificación de casos de uso |
| `6-calidad/` | Seguridad, rendimiento, mantenimiento y sustitución |
| `7-pruebas/` | Informe de pruebas, casos de prueba manuales y resultados de rendimiento |
| `8-manual-de-usuario/` | Manual de uso de la aplicación y sus capturas |
| `9-despliegue/` | Guía para desplegar en Render y Vercel |
| `historico/` | Versiones anteriores, conservadas como referencia |

## 1-proyecto

- **`Documentacion-FitPocket.pdf`**: empezar por acá. Describe el proyecto, los usuarios, las funcionalidades, los requisitos con su estado, las tecnologías y los diagramas. Actualizada en octubre de 2026.
- `Documentacion-FitPocket.docx`: la misma documentación en formato editable. Ya incluye los cambios de la consigna final (secciones nuevas, requisitos RF23 a RF29 y RNF18 a RNF24, y como anexos el manual de usuario y la guía de despliegue). **El PDF todavía es la versión anterior:** hay que volver a exportarlo desde Word.
- `Lista-de-haceres.pdf`: registro diario del equipo, del 20 de marzo al 8 de abril de 2026.
- `cambios-a-la-documentacion.docx`: cambios a aplicar a la documentación principal para la consigna final.
- `participantes-y-roles.docx`: integrantes del equipo y rol de cada uno.

## 2-diseno

- **`Diseno-FrontEnd.pdf`**: capturas de la aplicación actual, cada pantalla en computadora y en celular. Actualizado en octubre de 2026.
- `Diseno-FrontEnd.docx`: el mismo documento en formato editable.
- `logo/`: el logo en cinco variantes (solo, invertido, con texto, con texto invertido y con texto invertido sobre fondo negro).

## 3-base-de-datos

- `Documentacion-Base-de-Datos.pdf`: explicación de las colecciones. Es de abril de 2026 y describe el diseño inicial: menciona n8n y la colección de alertas, que no forman parte del proyecto actual. El modelo vigente está en el diagrama de clases de la documentación principal.
- `Esquema-documentos.drawio`: diagrama del esquema. Se abre con [diagrams.net](https://app.diagrams.net).
- `der-logico.docx`: DER lógico del modelo vigente.
- `estrategia-de-datos.docx`: backup, índices, vencimiento (TTL) y dígitos verificadores (DVH/DVV).
- `datos-de-ejemplo/`: un documento de muestra de cada colección (`usuarios.json`, `planes.json`, `checkins.json`), con la estructura del diseño inicial.

## 4-backend

- `Apunte-Backend.pdf`: apunte sobre la organización de carpetas y archivos del backend. Es de abril de 2026; la estructura general sigue vigente, pero menciona n8n y el modelo de alertas, que ya no se usan.
- `diagrama-de-clases.docx`: diagrama de clases del backend.
- `patrones-de-diseno.docx`: patrones de diseño aplicados y dónde se usan.

## 5-casos-de-uso

- `diagrama-general.docx`: diagrama general de casos de uso por actor.
- `especificaciones.docx`: especificación de seis casos de uso, con su diagrama de secuencia del sistema (DSS).

## 6-calidad

- `seguridad.docx`, `rendimiento.docx` y `mantenimiento-y-sustitucion.docx`.

## 7-pruebas

- `informe-de-pruebas.docx`: resumen de las pruebas automáticas y sus resultados.
- `casos-de-prueba-manuales.docx`: casos de prueba para completar a mano.
- `rendimiento.md` y `rendimiento.json`: resultados de la prueba de rendimiento. Los genera `npm run test:perf` en `fullStack/backend`, por eso quedan en Markdown.

## 8-manual-de-usuario

- `manual-de-usuario.docx`: manual de uso de la aplicación, con capturas.
- `capturas/`: las capturas del manual, también usadas en la especificación de casos de uso.

## 9-despliegue

- `despliegue.docx`: guía paso a paso para desplegar en Render y Vercel.

## historico

- `Documentacion-FitPocket-2026-06.pdf`: documentación principal anterior, con la arquitectura planificada originalmente.
- `Diseno-FrontEnd-maquetas-2026-04.pdf`: maquetas de diseño previas al desarrollo.
