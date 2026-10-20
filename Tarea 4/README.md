# SOC Hospitalario — Plataforma de Gestión de Incidentes de Ciberseguridad

## Unidad 4: Node.js, Express, Estructura de Proyecto, CRUD, Middleware, REST e Integración Front-End con Fetch API

Plataforma de triaje, monitoreo y mitigación de incidentes de ciberseguridad para el **Hospital Clínico San Rafael**. Implementa una arquitectura desacoplada cliente-servidor con **Express 5**, un modelo de datos en memoria con validación defensiva *Zero-Trust*, middlewares perimetrales de registro y gestión de errores, y una interfaz web que consume la API REST mediante la **Fetch API** moderna.

---

## 1. Estructura del Proyecto (Clean Architecture & Capas)

```text
Tarea 4/
├── package.json                   # Dependencias (Express), scripts start y test
├── server.js                      # Punto de entrada HTTP y arranque del listener
├── server/
│   ├── app.js                     # Integración HTTP del servidor Express
│   ├── incident-repository.js     # Repositorio de lectura inicial
│   └── incident-service.js        # Servicio de validación de contrato
├── src/
│   ├── app.js                     # Configuración principal de Express y middlewares
│   ├── routes/
│   │   └── incidentes.routes.js   # Rutas REST para /api/incidentes (CRUD)
│   ├── controllers/
│   │   └── incidentes.controller.js # Controladores de peticiones y respuestas HTTP
│   ├── models/
│   │   └── incidentes.model.js    # Modelo en memoria con validación Zero-Trust
│   └── middleware/
│       ├── logger.js              # Middleware de registro y auditoría HTTP con métricas ms
│       └── errorHandler.js        # Manejador centralizado 404 y supresión de fugas (stack traces)
├── js/
│   ├── modelo.js                  # Modelo cliente con métodos Fetch (GET, POST, PATCH, DELETE)
│   ├── vista.js                   # Vista con renderizado XSS-safe y acciones CRUD en tabla
│   ├── controlador.js             # Controlador MVC que conecta eventos DOM y llamadas Fetch
│   ├── app.js                     # Bootstrapper del cliente
│   └── vendor/jquery.min.js       # jQuery 3.7.1 local para transiciones visuales
├── css/
│   └── styles.css                 # CSS3 puro, box-model universal, CSS Grid y Flexbox
├── data/
│   └── incidentes.json            # Dataset base de incidentes hospitalarios
├── tests/
│   └── server.test.js             # Pruebas automatizadas (11 tests unitarios y de integración)
└── index.html                     # Interfaz web semántica y accesible (WCAG 2.2 AA)
```

---

## 2. API REST: Contrato de Endpoints y Operaciones CRUD

La API expone el prefijo `/api/incidentes` con cabeceras defensivas (`X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Cache-Control: no-store`):

| Método | Endpoint | Descripción | Códigos HTTP |
| :--- | :--- | :--- | :---: |
| `GET` | `/api/salud` | Health Check y tiempo activo (*uptime*) del servidor. | `200` |
| `GET` | `/api/incidentes` | Listado completo de incidentes. Admite filtros de query: `?severidad=alta`, `?busqueda=ransomware`, `?estado=VLAN`. | `200` |
| `GET` | `/api/incidentes/:id` | Búsqueda y detalle de un incidente por su código único (`INC-XXXX`). | `200`, `404` |
| `POST` | `/api/incidentes` | Creación de nuevo incidente con validación Zero-Trust de formato y unicidad. | `201`, `400`, `409` |
| `PATCH` / `PUT` | `/api/incidentes/:id` | Actualización asistencial de estado, severidad o acciones inmediatas. | `200`, `400`, `404` |
| `DELETE` | `/api/incidentes/:id` | Baja/eliminación de un incidente del catálogo hospitalario. | `200`, `404` |

---

## 3. Middlewares Implementados

1. **Middleware de Registro (`src/middleware/logger.js`):**
   - Registra cada solicitud HTTP en consola indicando: etiqueta semántica (`[INFO]`, `[WARN]`, `[CRIT]`), timestamp ISO, IP del cliente, método HTTP, ruta solicitada, código de estado y duración calculada en nanosegundos/milisegundos (`ms`).
2. **Middleware de Manejo de Errores (`src/middleware/errorHandler.js`):**
   - Captura rutas no reconocidas bajo `/api/*` y retorna JSON estructurado con estado `404`.
   - Captura excepciones del servidor y de formato JSON (400).
   - Suprime cualquier traza interna de ejecución (*stack traces*) o rutas locales de disco, garantizando **Zero Information Leakage**.

---

## 4. Front-End: Integración con Fetch API y Accesibilidad

- **Consumo Asíncrono de la API:**
  - El cliente utiliza `Fetch API` con `async/await` para comunicarse con Express.
  - Soporte de filtros reactivos por severidad y búsqueda en vivo mediante debounce (`GET /api/incidentes?severidad=...&busqueda=...`).
- **Creación Dinámica de Incidentes:**
  - El formulario accesible valida en el cliente y envía una petición `POST` con `Content-Type: application/json`. Al recibir `201 Created`, actualiza la tabla en tiempo real con animación visual.
- **Acciones Rápidas en Tabla:**
  - Botón **⚡ Triaje**: Permite cambiar el estado del incidente mediante `PATCH /api/incidentes/:id`.
  - Botón **🗑️ Eliminar**: Elimina el incidente del catálogo mediante `DELETE /api/incidentes/:id` con confirmación previa.
- **Seguridad Defensiva en el DOM:**
  - Se erradica por completo `innerHTML` para datos de usuario o respuestas de red, previniendo vulnerabilidades de inyección Cross-Site Scripting (XSS).
- **Accesibilidad WCAG 2.2 Nivel AA:**
  - Regiones vivas ARIA (`role="status"`, `role="alert"`, `aria-live="polite"`), foco visible y asociación semántica obligatoria `<label for>` con `<input id>`.

---

## 5. Instrucciones de Ejecución y Pruebas

### Instalación de Dependencias
```bash
npm install
```

### Iniciar el Servidor de Producción / Desarrollo
```bash
npm start
```
El servidor quedará disponible en:
- Interfaz Web: `http://127.0.0.1:3000`
- API REST Incidentes: `http://127.0.0.1:3000/api/incidentes`
- Endpoint de Salud: `http://127.0.0.1:3000/api/salud`

### Ejecutar Suite de Pruebas Automatizadas
```bash
npm test
```
Ejecuta la suite completa de 11 tests con el ejecutor nativo `node --test`, validando todos los métodos CRUD, filtros, códigos HTTP, middlewares y entrega estática.
