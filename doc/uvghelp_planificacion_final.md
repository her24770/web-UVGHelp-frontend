# UVGHelp — Planificación Técnica Completa
> Sistema de información universitaria inteligente con chatbot IA — Universidad del Valle de Guatemala

---

## Visión

Dos productos en uno:
- **Panel Admin** — administradores de la UVG gestionan información general de la universidad
- **UVGHelp Bot** — estudiantes hacen preguntas en lenguaje natural y el sistema responde usando información general de la U + memoria personal del estudiante

---

## Repositorios

| Repo | Descripción | Tecnología |
|------|-------------|------------|
| `uvghelp-backend` | API REST + lógica RAG | Python + FastAPI |
| `uvghelp-admin` | Panel de administración | HTML + CSS + JavaScript Vanilla |
| `uvghelp-bot` | Interfaz del chatbot | React + Vite + TailwindCSS |

> **Nota:** El admin está en vanilla JS (HTML + CSS + fetch()). Migración a React queda como feature futura si hay tiempo.

---

## Stack Tecnológico

### Backend
| Tecnología | Versión | Uso |
|------------|---------|-----|
| Python | 3.11+ | Lenguaje base |
| FastAPI | Latest | API REST + Swagger automático |
| SQLAlchemy | 2.x | ORM |
| Alembic | Latest | Migraciones de BD |
| PostgreSQL | 15+ | Datos estructurados |
| pgvector | Latest | Embeddings RAG |
| Redis | 7+ | Sesiones activas de chat + cache |
| LangChain | Latest | Framework RAG |
| OpenAI API | Latest | GPT-4o + text-embedding-3-small |
| APScheduler | Latest | Limpieza de conversaciones cada 3 días |
| PyMuPDF | Latest | Extracción de texto de PDFs |
| Pydantic | v2 | Validación de datos |
| Docker | Latest | Containerización |

### Frontend Admin
| Tecnología | Uso |
|------------|-----|
| HTML semántico | Estructura |
| CSS puro | Estilos sin frameworks |
| JavaScript Vanilla | Lógica, fetch() para llamadas a API |

> Sin React, sin librerías externas, sin jQuery, sin axios.

### Frontend Bot
| Tecnología | Uso |
|------------|-----|
| React 18 + Vite | Framework UI |
| TailwindCSS | Estilos mobile-first |
| assistant-ui | Componentes de chat con streaming nativo |
| Axios | Llamadas a la API |

---

## Base de Datos

### PostgreSQL — Datos estructurados (admin gestiona)

```
lugares
├─ id (uuid PK)
├─ nombre, descripcion
├─ edificio, piso, categoria
├─ horario_apertura, horario_cierre
├─ imagen_url
└─ created_at, updated_at

eventos
├─ id (uuid PK)
├─ titulo, descripcion
├─ tipo (charla/deva/hora_beca/actividad/otro)
├─ fecha_inicio, fecha_fin
├─ lugar_id (FK)
├─ imagen_url
└─ created_at, updated_at

servicios
├─ id (uuid PK)
├─ nombre, descripcion
├─ categoria, horario
├─ contacto_id (FK)
└─ created_at, updated_at

carreras
├─ id (uuid PK)
├─ nombre, facultad
├─ duracion_semestres, pensum_url
└─ created_at, updated_at

cursos
├─ id (uuid PK)
├─ nombre, codigo, creditos
├─ carrera_id (FK), profesor_id (FK)
├─ semestre
└─ created_at, updated_at

profesores
├─ id (uuid PK)
├─ nombre, apellido
├─ email, telefono
├─ carrera_id (FK), departamento
└─ created_at, updated_at

pagos
├─ id (uuid PK)
├─ concepto, tipo
├─ monto, moneda
├─ descripcion, periodo
└─ created_at, updated_at
(sin relaciones — información general de aranceles, costos, atrasos)

contactos
├─ id (uuid PK)
├─ nombre, cargo
├─ email, telefono, extension
├─ departamento
└─ created_at, updated_at

usuarios
├─ id (uuid PK)
├─ nombre, apellido
├─ email, carnet
├─ carrera_id (FK)
├─ rol (admin/estudiante)
├─ password_hash
└─ created_at, updated_at

conversaciones
├─ id (uuid PK)
├─ usuario_id (FK)
├─ mensajes (JSONB)
├─ created_at
└─ expires_at (created_at + 3 días)
```

### pgvector — RAG general + memorias personales

```
faqs
├─ id (uuid PK)
├─ pregunta, respuesta
├─ categoria
├─ embedding (vector 1536)
└─ created_at

procesos
├─ id (uuid PK)
├─ titulo, contenido
├─ categoria (tramite/reglamento/academico)
├─ embedding (vector 1536)
└─ created_at

info_general
├─ id (uuid PK)
├─ titulo, contenido
├─ tipo (historia/mision/vision/noticias/otro)
├─ embedding (vector 1536)
└─ created_at

memorias
├─ id (uuid PK)
├─ usuario_id (FK)
├─ titulo
├─ contenido (TEXT — markdown)
├─ embedding (vector 1536)
├─ tipo (horario/notas/grupos/metas/otro)
└─ created_at, updated_at
```

### Redis — Sesiones activas + cache

```
sesion:{usuario_id}
├─ mensajes del chat activo (lista JSON)
├─ TTL: 3 días
└─ al expirar o cerrar → persiste en PostgreSQL

cache:pregunta:{hash}
├─ respuesta generada
└─ TTL: 6 horas

rate_limit:{usuario_id}
├─ contador de mensajes por hora
└─ TTL: 1 hora
```

---

## Relaciones entre Entidades

```
usuarios        ||--o{  memorias          : "tiene"
usuarios        ||--o{  conversaciones    : "tiene"
usuarios        }o--||  carreras          : "pertenece a"
carreras        ||--o{  cursos            : "tiene"
carreras        ||--o{  profesores        : "tiene"
profesores      ||--o{  cursos            : "imparte"
lugares         ||--o{  eventos           : "aloja"
contactos       ||--o{  servicios         : "atiende"
pagos                   (sin relaciones)
```

---

## Arquitectura de Carpetas

### Backend (`uvghelp-backend`)
```
uvghelp-backend/
├── app/
│   ├── main.py
│   ├── config.py
│   ├── database.py
│   ├── redis.py
│   │
│   ├── models/
│   │   ├── lugar.py
│   │   ├── evento.py
│   │   ├── servicio.py
│   │   ├── carrera.py
│   │   ├── curso.py
│   │   ├── profesor.py
│   │   ├── pago.py
│   │   ├── contacto.py
│   │   ├── usuario.py
│   │   ├── memoria.py
│   │   └── conversacion.py
│   │
│   ├── schemas/
│   │   └── (un schema Pydantic por entidad)
│   │
│   ├── routers/
│   │   ├── auth.py
│   │   ├── lugares.py
│   │   ├── eventos.py
│   │   ├── servicios.py
│   │   ├── carreras.py
│   │   ├── cursos.py
│   │   ├── profesores.py
│   │   ├── pagos.py
│   │   ├── contactos.py
│   │   ├── usuarios.py
│   │   ├── memorias.py
│   │   └── chat.py
│   │
│   ├── services/
│   │   ├── rag_service.py
│   │   ├── embedding_service.py
│   │   ├── memory_service.py
│   │   ├── pdf_service.py
│   │   ├── session_service.py
│   │   ├── cache_service.py
│   │   ├── export_service.py
│   │   └── scheduler.py
│   │
│   └── utils/
│       ├── pagination.py
│       ├── tokens.py
│       └── responses.py
│
├── migrations/
│   └── versions/
├── tests/
├── .env
├── .env.example
├── requirements.txt
├── Dockerfile
├── docker-compose.yml
└── README.md
```

### Admin (`uvghelp-admin`)
```
uvghelp-admin/
├── index.html
├── docker-compose.yml
├── Dockerfile
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
│   └── vectores.html
│
├── js/
│   ├── api.js              # fetch() base, headers, manejo de errores
│   ├── auth.js             # login, logout, JWT
│   ├── router.js           # navegación entre páginas
│   ├── utils.js            # helpers generales
│   ├── components/
│   │   ├── table.js        # tabla reutilizable
│   │   ├── modal.js        # modal reutilizable
│   │   ├── toast.js        # notificaciones
│   │   └── pagination.js
│   └── pages/
│       ├── lugares.js
│       ├── eventos.js
│       └── (uno por entidad)
│
└── css/
    ├── variables.css
    ├── global.css
    ├── components/
    │   ├── sidebar.css
    │   ├── table.css
    │   ├── modal.css
    │   └── forms.css
    └── pages/
        ├── dashboard.css
        └── login.css
```

### Bot (`uvghelp-bot`)
```
uvghelp-bot/
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Welcome.jsx
│   │   ├── Chat.jsx
│   │   └── Memorias.jsx
│   ├── components/
│   │   ├── ChatWindow.jsx
│   │   ├── MessageBubble.jsx
│   │   ├── MessageInput.jsx
│   │   ├── TypingIndicator.jsx
│   │   ├── SuggestionChips.jsx
│   │   └── MemoriaCard.jsx
│   ├── services/
│   │   ├── api.js
│   │   ├── chatService.js
│   │   └── memoriasService.js
│   ├── hooks/
│   │   └── useChat.js
│   └── context/
│       └── AuthContext.jsx
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
├── Dockerfile
└── README.md
```

---

## Endpoints REST

### Patrón general
```
GET    /api/{entidad}              → listar (paginación + búsqueda + ordenamiento)
GET    /api/{entidad}/{id}         → detalle
POST   /api/{entidad}              → crear (201)
PUT    /api/{entidad}/{id}         → editar
DELETE /api/{entidad}/{id}         → eliminar (204)
GET    /api/{entidad}/export/csv   → exportar CSV
GET    /api/{entidad}/export/xlsx  → exportar Excel
```

### Query params estándar
```
?page=1&limit=20
?q=farmacia
?sort=nombre&order=asc
```

### Endpoints especiales
```
POST   /api/auth/login
POST   /api/auth/logout
GET    /api/auth/me

POST   /api/chat
GET    /api/chat/historial

POST   /api/memorias
GET    /api/memorias
DELETE /api/memorias/{id}

POST   /api/upload/pdf
POST   /api/upload/imagen

POST   /api/admin/vectores/reindex
```

### Respuesta estándar de error
```json
{
  "error": true,
  "code": "NOT_FOUND",
  "message": "El lugar con id 5 no existe",
  "status": 404
}
```

---

## Flujo del Chatbot (RAG)

```
Estudiante escribe pregunta
          ↓
¿Está en cache Redis?
  Sí → devuelve respuesta cacheada
  No → continúa
          ↓
Búsqueda en paralelo:
  PostgreSQL → datos estructurados exactos
  pgvector   → top 3 faqs/procesos/info_general + top 2 memorias del usuario
          ↓
Construye contexto con resultados
          ↓
Llama a GPT-4o con contexto + pregunta
          ↓
Streaming de respuesta al frontend
          ↓
Guarda en Redis (sesión activa)
Guarda respuesta en cache Redis (TTL 6h)
```

### Flujo de sesión
```
Estudiante abre chat → sesión en Redis
Cada mensaje → se agrega a Redis
Al cerrar o expirar 3 días → persiste en PostgreSQL → Redis se limpia
```

### Flujo de memorias
```
Estudiante sube PDF
  → PyMuPDF extrae texto
  → GPT-4o convierte a MD limpio
  → text-embedding-3-small genera embedding
  → guarda en memorias con usuario_id
```

---

## Variables de Entorno

```env
DATABASE_URL=postgresql://user:password@localhost:5432/uvghelp_db
REDIS_URL=redis://localhost:6379
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
JWT_SECRET=secreto-muy-largo
JWT_EXPIRE_HOURS=24
APP_ENV=production
APP_PORT=8000
CORS_ORIGINS=https://tu-dominio.com
CONVERSATION_EXPIRE_DAYS=3
CACHE_TTL_HOURS=6
```

---

## Deploy (Kubernetes con k3s)

```
Tu servidor con k3s
└── Namespace: uvghelp-prod
    ├── Deployment: backend    (2 replicas)
    ├── Deployment: admin      (1 replica)
    ├── Deployment: bot        (1 replica)
    ├── StatefulSet: postgres  (con pgvector)
    ├── StatefulSet: redis
    ├── Ingress:
    │   ├── /        → bot
    │   ├── /admin   → admin
    │   └── /api     → backend
    ├── ConfigMap:   variables no sensibles
    ├── Secret:      API keys, passwords
    └── PersistentVolume: datos PostgreSQL + Redis
```

---

## Estimado de Costos

| Servicio | Costo estimado/mes |
|----------|-------------------|
| OpenAI GPT-4o (tráfico bajo) | ~$5–15 |
| OpenAI Embeddings | ~$0.50 |
| Servidor propio | $0 extra |
| pgvector + Redis (self-hosted) | $0 |
| **Total** | **~$6–16/mes** |

---

## Features Futuras

### Corto plazo
- Recordatorios por email via SMTP Outlook — "recuérdame mañana a las 8am que tengo reunión con Miguel"
- Rate limiting por usuario activado (ya preparado en Redis)
- Búsqueda full-text avanzada con Typesense

### Mediano plazo
- SSO con Microsoft Office 365 — autenticación con cuenta institucional UVG
- Migración del admin de vanilla JS a React
- Notificaciones push para eventos próximos
- Dashboard de analytics para admin (preguntas frecuentes, temas sin respuesta)
- Bot de Telegram como canal adicional

### Largo plazo
- Integración con sistema académico de la UVG si abren API
- Agentes autónomos — inscribir eventos, agendar citas, enviar formularios
- Multimodal — estudiante manda foto de documento y el bot lo procesa
- App móvil nativa con React Native

