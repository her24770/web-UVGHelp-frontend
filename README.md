# UVGHelp Admin

Panel de administración para el sistema UVGHelp. Construido con HTML + CSS + JavaScript Vanilla (sin frameworks, sin librerías externas).

## Requisitos

- Docker y Docker Compose (recomendado)
- O cualquier servidor HTTP estático (Live Server, nginx, Python http.server)

## Correr con Docker

```bash
docker-compose up --build
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

## Correr sin Docker

```bash
# Con Python
python3 -m http.server 3000

# Con Node.js (npx)
npx serve .
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador.

> El proyecto usa módulos ES nativos (`type="module"`), por lo que necesita un servidor HTTP. No funciona abriendo el archivo directamente desde el sistema de archivos (`file://`).

## Variables de entorno

La URL base del API se configura en `js/api.js`:

```js
const API_BASE = 'http://localhost:8000/api';
```

Cambiá ese valor para apuntar al backend en producción.

## Estructura del proyecto

```
├── index.html              # Redirección automática (login / dashboard)
├── pages/                  # Una página HTML por sección
├── js/
│   ├── api.js              # Wrapper fetch() con auth
│   ├── auth.js             # Manejo de JWT
│   ├── router.js           # Protección de páginas
│   ├── utils.js            # Helpers generales
│   ├── components/         # Componentes reutilizables (table, modal, toast…)
│   └── pages/              # Lógica por página
└── css/
    ├── variables.css        # Tokens de diseño
    ├── global.css           # Reset y estilos base
    ├── components/          # Estilos de componentes
    └── pages/               # Estilos por página
```

## Challenges implementados

- Exportar lista a CSV (generado manualmente en JS, sin librerías)
- Exportar lista a Excel .xlsx (formato SpreadsheetML, sin librerías)
- Búsqueda en tiempo real con debounce
- Paginación y ordenamiento con estado en URL
- Upload de imágenes

## Reflexión
