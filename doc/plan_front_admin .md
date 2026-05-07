# Plan Frontend Admin — UVGHelp (Tarea)
> Repo: `uvghelp-admin` | HTML + CSS + JavaScript Vanilla

---

## Objetivo de esta fase

Construir el panel de administración que consume la API REST del backend. Sin frameworks, sin librerías externas. Solo HTML, CSS y fetch() nativo.

---

## Stack

```
HTML5 semántico
CSS puro (variables CSS, sin frameworks)
JavaScript Vanilla ES6+ (módulos nativos, fetch())
Sin React, sin jQuery, sin axios, sin Bootstrap
```

---

## Estructura de Carpetas

```
uvghelp-admin/
├── index.html               # redirige a login o dashboard según JWT
├── Dockerfile
├── docker-compose.yml
├── README.md
│
├── pages/
│   ├── login.html
│   ├── dashboard.html
│   ├── lugares.html
│   ├── eventos.html
│   ├── servicios.html
│   ├── carreras.html
│   ├── cursos.html
│   ├── profesores.html
│   ├── pagos.html
│   ├── contactos.html
│   └── usuarios.html
│
├── js/
│   ├── api.js               # fetch() base, headers, manejo de errores
│   ├── auth.js              # login, logout, getToken, isAuthenticated
│   ├── router.js            # proteger páginas con JWT
│   ├── utils.js             # helpers: formatDate, formatMoney, debounce
│   │
│   ├── components/
│   │   ├── table.js         # renderiza tabla reutilizable
│   │   ├── modal.js         # abre/cierra modales
│   │   ├── toast.js         # notificaciones éxito/error
│   │   ├── pagination.js    # renderiza paginación
│   │   └── confirm.js       # dialog de confirmación para eliminar
│   │
│   └── pages/
│       ├── login.js
│       ├── dashboard.js
│       ├── lugares.js
│       ├── eventos.js
│       ├── servicios.js
│       ├── carreras.js
│       ├── cursos.js
│       ├── profesores.js
│       ├── pagos.js
│       ├── contactos.js
│       └── usuarios.js
│
└── css/
    ├── variables.css        # tokens de diseño
    ├── global.css           # reset, base, tipografía
    ├── layout.css           # sidebar, header, contenido principal
    │
    ├── components/
    │   ├── sidebar.css
    │   ├── header.css
    │   ├── table.css
    │   ├── modal.css
    │   ├── forms.css
    │   ├── buttons.css
    │   ├── toast.css
    │   ├── pagination.css
    │   └── badges.css
    │
    └── pages/
        ├── login.css
        └── dashboard.css
```

---

## Docker Compose

```yaml
# docker-compose.yml
version: '3.8'
services:
  uvghelp-admin:
    build: .
    ports:
      - "3000:80"
```

```dockerfile
# Dockerfile
FROM nginx:alpine
COPY . /usr/share/nginx/html
EXPOSE 80
```

---

## Vistas a implementar

### Login
- Formulario email + password
- Llamada a POST /api/auth/login
- Guarda JWT en localStorage
- Redirige a dashboard si ya hay JWT

### Dashboard
- Tarjetas con totales: lugares, eventos, cursos, profesores
- Lista de próximos eventos (3-5)
- Acceso rápido a cada sección

### Vista de lista (patrón para todas las entidades)
- Barra superior con título + botón "Agregar"
- Barra de búsqueda (?q=) con debounce
- Selector de ordenamiento (?sort= y ?order=)
- Tabla con columnas relevantes por entidad
- Columna de acciones: editar, eliminar
- Paginación abajo (?page= y ?limit=)
- Botones exportar CSV y Excel

### Modal crear/editar
- Formulario con campos de la entidad
- Validación visual en el cliente (campos requeridos)
- Llamada a POST o PUT según el caso
- Toast de éxito o error al guardar
- Cierra el modal y recarga la tabla

### Confirmación de eliminar
- Dialog "¿Seguro que querés eliminar X?"
- Botón confirmar llama DELETE
- Toast de éxito
- Recarga la tabla

---

## Estructura de Ramas

```
main
└── develop
    ├── chore/setup-estructura-base
    ├── chore/docker-nginx
    ├── feature/login-y-auth
    ├── feature/layout-sidebar-header
    ├── feature/crud-entidades
    ├── feature/paginacion-busqueda
    └── feature/export-csv-xlsx
```

### Detalle de cada rama

**`chore/setup-estructura-base`** — sale de `develop`
```
- Crear estructura de carpetas completa
- index.html base
- css/variables.css con todos los tokens de diseño
- css/global.css con reset y tipografía base
- js/api.js con fetch() base
- js/utils.js con helpers básicos
Commit: chore(setup): inicializar estructura base del admin vanilla JS
```

**`chore/docker-nginx`** — sale de `develop`
```
- Dockerfile con nginx:alpine
- docker-compose.yml
- README con instrucciones de instalación
Commit: chore(docker): agregar Dockerfile y docker-compose con nginx
```

**`feature/login-y-auth`** — sale de `develop`
```
- pages/login.html con formulario
- css/pages/login.css
- js/pages/login.js con llamada a POST /api/auth/login
- js/auth.js con getToken, setToken, logout, isAuthenticated
- js/router.js para proteger páginas sin JWT
- index.html redirige según estado de auth
Commits:
  feat(auth): agregar página de login con formulario
  feat(auth): agregar manejo de JWT en localStorage
  feat(auth): proteger páginas que requieren autenticación
```

**`feature/layout-sidebar-header`** — sale de `develop`
```
- Layout base con sidebar fija y área de contenido
- Sidebar con navegación a todas las secciones
- Header con nombre del admin y botón logout
- css/layout.css, css/components/sidebar.css, css/components/header.css
- Componentes JS: table.js, modal.js, toast.js, pagination.js, confirm.js
- pages/dashboard.html con tarjetas de stats
Commits:
  style(layout): agregar sidebar, header y layout principal
  feat(dashboard): agregar vista de dashboard con estadísticas
  feat(components): agregar componentes reutilizables table, modal, toast
```

**`feature/crud-entidades`** — sale de `develop`
```
- Una página HTML + JS por entidad (lugares, eventos, servicios, etc.)
- Cada una con: lista en tabla, modal crear, modal editar, confirmar eliminar
- Toast de feedback en cada acción
- Imagen upload donde aplique
Commits:
  feat(lugares): agregar CRUD completo de lugares
  feat(eventos): agregar CRUD completo de eventos
  feat(servicios): agregar CRUD completo de servicios
  feat(carreras): agregar CRUD completo de carreras
  feat(cursos): agregar CRUD completo de cursos
  feat(profesores): agregar CRUD completo de profesores
  feat(pagos): agregar CRUD completo de pagos
  feat(contactos): agregar CRUD completo de contactos
```

**`feature/paginacion-busqueda`** — sale de `develop`
```
- Paginación visual en todas las listas
- Búsqueda en tiempo real con debounce (300ms)
- Selector de ordenamiento por columna
- Estado de la URL actualizado con los filtros activos
Commits:
  feat(paginacion): agregar paginación visual en todas las listas
  feat(busqueda): agregar búsqueda con debounce en todas las listas
  feat(ordenamiento): agregar selector de ordenamiento en todas las listas
```

**`feature/export-csv-xlsx`** — sale de `develop`
```
- Botón exportar CSV en cada lista
- Botón exportar Excel en cada lista
- CSV generado manualmente en JavaScript sin librerías
- XLSX en formato SpreadsheetML generado manualmente
- Descarga directa desde el navegador
Commits:
  feat(export): agregar exportación a CSV generado manualmente en JS
  feat(export): agregar exportación a Excel XLSX en formato SpreadsheetML
```

---

## Checklist final antes de entregar

- [ ] Login funciona y guarda JWT
- [ ] Páginas protegidas redirigen a login sin JWT
- [ ] Dashboard muestra totales reales de la API
- [ ] Todas las entidades tienen lista con tabla
- [ ] Crear funciona con validación y toast
- [ ] Editar funciona con datos precargados en modal
- [ ] Eliminar tiene confirmación y toast
- [ ] Paginación funciona (?page= y ?limit=)
- [ ] Búsqueda funciona en tiempo real (?q=)
- [ ] Ordenamiento funciona (?sort= y ?order=)
- [ ] Export CSV descarga archivo real
- [ ] Export XLSX abre en Excel/LibreOffice
- [ ] Sin librerías externas (solo fetch() y DOM)
- [ ] Docker Compose levanta con un comando
- [ ] Deploy en servidor accesible
- [ ] README con instrucciones, screenshot y reflexión
- [ ] Lista de challenges implementados en README

