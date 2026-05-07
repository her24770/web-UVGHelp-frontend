
## Puntos

Aquí es donde vienen los puntos. Los challenges son opcionales pero son la única forma de obtener nota. La nota máxima es 100. Escojan qué quieren implementar.

### Criterios Subjetivos

Los criterios subjetivos son evaluados por el catedrático. No hay una respuesta correcta, pero sí hay una diferencia visible entre esfuerzo real y esfuerzo mínimo.

| Challenge | Puntos |
|-----------|--------|
| [Subjetivo] Calidad visual del cliente — ¿Se ve como una app real o como una tarea? | 0 – 30 |
| [Subjetivo] Calidad del historial de Git — commits descriptivos, progresión lógica, no un solo commit con todo | 0 – 20 |
| [Subjetivo] Organización del código — archivos separados con responsabilidades claras, en ambos repositorios | 0 – 20 |

### API y Backend

| Challenge | Puntos |
|-----------|--------|
| Spec de OpenAPI/Swagger escrita y precisa (el contrato de la API en YAML o JSON) | 20 |
| Swagger UI corriendo y siendo servido desde el backend (no solo el archivo) | 20 |
| Códigos HTTP correctos en toda la API (201 al crear, 204 al eliminar, 404 si no existe, 400 en input inválido, etc.) | 20 |
| Validación server-side con respuestas de error en JSON descriptivas | 20 |
| Paginación en `GET /series` con parámetros `?page=` y `?limit=` | 30 |
| Búsqueda por nombre con `?q=` | 15 |
| Ordenamiento con `?sort=` y `?order=asc\|desc` | 15 |

### Challenges

| Challenge | Puntos |
|-----------|--------|
| Exportar la lista de series a CSV — generado manualmente desde JavaScript, sin librerías. El archivo debe descargarse desde el navegador. | 20 |
| Exportar la lista de series a Excel (.xlsx) — generado manualmente desde JavaScript, sin librerías de ningún tipo. El archivo debe ser un .xlsx real que abra correctamente en Excel o LibreOffice. Tip: investiguen el formato SpreadsheetML. | 30 |
| Sistema de rating — tabla propia en la base de datos, endpoints REST propios (`POST /series/:id/rating`, `GET /series/:id/rating`, etc.), y visible en el cliente. | 30 |
| Permite subir imágenes (pongan un tope de como 1 mega a la imagen) | 30 |

## Entrega

Suban al campus virtual:

- Link al repositorio del backend
- Link al repositorio del cliente

Cada repositorio debe tener:

- Un `README.md` con instrucciones claras para correr el proyecto localmente
- Un screenshot de la aplicación funcionando
- Una lista de los challenges que implementaron
- Una pequeña reflexión sobre la tech que usaron y los challenges (¿la usarían de nuevo?). Si no hacen esta reflexión tienen **-20 puntos**.

> ⚠️ Si alguno de los dos repositorios no existe, está vacío, o no tiene README, la nota es cero.

> ⚠️ Si no está publicado en algún server, la nota es cero.

> ⚠️ Si su código es muy similar al de alguien más, tienen cero sin posibilidad de re-entrega. Excusas como "seguí un tutorial" o "lo generó ChatGPT" no son justificación.