# 🛡️ Plataforma Integral de Gestión y Respuesta a Incidentes CSIRT / SOC

Bienvenido al repositorio unificado de la **Plataforma de Gestión de Incidentes de Ciberseguridad**. Este proyecto ha sido desarrollado de forma incremental y modular a través de 7 Unidades de Aprendizaje (Tareas), culminando en un sistema empresarial robusto, seguro, testeado y listo para ser desplegado en entornos de producción.

---

## 🗺️ Mapa de Evolución del Proyecto

Cada carpeta en la raíz representa un hito arquitectónico en el desarrollo de la plataforma:

| Módulo / Carpeta | Enfoque Pedagógico | Componentes y Tecnologías | Estado |
| :--- | :--- | :--- | :---: |
| **`Tarea 1`** | Maquetación y Prototipado UI | HTML5 Semántico, CSS3 Vanilla, Diseño Responsivo, Formulario de Incidentes. |  Completo |
| **`Tarea 2`** | Interactividad y Manipulación DOM | JavaScript ES6 Vanilla, Consumo de Datos Mock, Event Listeners, Filtrado Dinámico. |  Completo |
| **`Tarea 3`** | Servidor HTTP y API Básica | Node.js Vanilla HTTP, Express.js, Pruebas Unitarias de Endpoints (`node --test`). | Completo |
| **`Tarea 4`** | Arquitectura en Capas (MVC) | Controladores, Servicios, Modelos en Memoria, Pruebas Automatizadas de Aislamiento. |  Completo |
| **`Tarea 5`** | Persistencia Relacional con ORM | MySQL 8.4 LTS, Prisma ORM, Migraciones SQL, Siembra de Datos (`seed.js`), Pruebas con TCP Probe. |  Completo |
| **`Tarea 6`** | Fortalecimiento y Ciberseguridad | JWT Bearer, RBAC (ADMIN, SUPERVISOR, ANALISTA), Bcrypt, Helmet, CORS, Rate Limit, Zod, Sanitize-HTML. |  Completo |
| **`Tarea 7.1 corregido`** | QA, Rendimiento y Refactorización | DevTools Profiling, Pruebas Jest + Supertest, Linter ESLint Flat Config, Optimización WebP, Cache-Control, APA 7ma Report. |  Completo |
| **`PROYECTO_FINAL_PRODUCCION`** | **Despliegue y Orquestación Final** | **Consolidación de todo el stack: Multi-stage Dockerfile, Docker Compose (MySQL + Node + Nginx), Reverse Proxy TLS, Jest/Node Tests, SPA.** | **Listo para Despliegue** |

---

## 🏛️ Arquitectura del Sistema de Producción (`PROYECTO_FINAL_PRODUCCION`)

El directorio `PROYECTO_FINAL_PRODUCCION` reúne las mejores prácticas y componentes validados en cada fase:

```
PROYECTO_FINAL_PRODUCCION/
├── public/                       # Frontend SPA Optimizado
│   ├── assets/                   # Topología de red WebP (ahorro 93.6% peso) y fallback PNG
│   ├── css/styles.css            # Estilos modernos Cyber SOC (Dark Mode)
│   ├── js/                       # Módulos ES6 (api.js, auth.js, incidentes.js, main.js)
│   └── index.html                # Interfaz de operador con RBAC en tiempo real
├── prisma/                       # Persistencia de Datos
│   ├── schema.prisma             # Modelos relacionales Usuario e Incidente (con resolución)
│   ├── seed.js                   # Aprovisionamiento seguro con contraseñas hasheadas (Bcrypt)
│   └── migrations/               # Historial de migraciones SQL idempotentes
├── src/                          # Backend en Capas (MVC)
│   ├── config/                   # Variables de entorno y cliente Prisma
│   ├── controllers/              # Controladores de Auth e Incidentes
│   ├── middlewares/              # JWT, RBAC, Zod, Sanitización XSS, Validar ID, Manejo de Errores
│   ├── routes/                   # Rutas seguras `/api/auth` y `/api/incidentes`
│   ├── schemas/                  # Validación estricta con esquemas Zod
│   ├── services/                 # Capa de negocio (Dual: Prisma/MySQL y Fallback en Memoria)
│   ├── utils/                    # Máquina de estados (ITIL) y gestión de tokens JWT
│   ├── app.js                    # Configuración Express con Helmet, CORS, Rate Limiting
│   └── server.js                 # Inicialización y Graceful Shutdown
├── tests/                        # Suite de Pruebas Automatizadas
│   ├── estado.test.js            # Pruebas unitarias de reglas de transición de estados
│   └── integracion.test.js       # Pruebas de integración, seguridad, RBAC y XSS
├── nginx/                        # Configuración de Proxy Inverso Perimetral
│   └── conf.d/default.conf       # Compresión gzip, proxy headers, rate limit y caché estático
├── Dockerfile                    # Construcción Multi-stage optimizada sobre Alpine Linux
├── docker-compose.yml            # Orquestación de MySQL 8.4, API Node.js y Nginx
└── .env.example                  # Plantilla de configuración de entorno
```

---

## ⚡ Guía Rápida de Ejecución

### 1. Ejecución Local Inmediata (Modo Pruebas / Sin Dependencias Externas)
Para ejecutar la plataforma de forma inmediata sin necesidad de levantar bases de datos:

```bash
cd PROYECTO_FINAL_PRODUCCION
cp .env.example .env
# Configure todas las variables obligatorias con secretos únicos (JWT_SECRET de al menos 32 bytes).
# Para MYSQL_PASSWORD use un valor hexadecimal: openssl rand -hex 24
npm install
npm test       # Ejecuta la suite de 17 pruebas unitarias y de integración (100% pass)
npm start      # Inicia el servidor en http://localhost:3000 con persistencia en memoria
```

### 2. Ejecución Completa con Docker Compose (Pila de Producción)
Para desplegar la arquitectura completa con **MySQL 8.4 LTS**, **Node.js 22** y **Proxy Nginx**:

```bash
cd PROYECTO_FINAL_PRODUCCION
cp .env.example .env
# Rellene .env con secretos únicos; JWT_SECRET debe tener al menos 32 bytes.
# Ejemplo para generar un secreto: openssl rand -base64 48
docker compose up --build -d
```

- El proxy publica HTTP únicamente en `127.0.0.1:80`; para acceso remoto debe configurarse un terminador TLS delante del proxy.
- **Panel de Control Web local:** `http://localhost` (a través de Nginx; el puerto 3000 no se publica al host).
- El servidor Node escucha en loopback por defecto; Compose lo enlaza a la red interna del proxy. En proveedores PaaS configure `HOST=0.0.0.0` únicamente cuando su ingress termine TLS.
- **Healthcheck:** `http://localhost/api/health`
- Las contraseñas de las cuentas iniciales se establecen mediante `ADMIN_PASSWORD`, `SUPERVISOR_PASSWORD` y `ANALISTA_PASSWORD` en `.env`. No hay credenciales por defecto.
- Rote cualquier secreto que se haya usado en una instalación anterior.

---

## 🔐 Matriz de Control de Acceso Basado en Roles (RBAC)

| Operación | Método HTTP | Ruta | ANALISTA | SUPERVISOR | ADMIN | Regla de Negocio Adicional |
| :--- | :---: | :--- | :---: | :---: | :---: | :--- |
| **Login** | `POST` | `/api/auth/login` | ✅ | ✅ | ✅ | Rate limit: 15 req/15 min. |
| **Listar Incidentes** | `GET` | `/api/incidentes` | ✅ | ✅ | ✅ | Cabecera `Cache-Control: private, no-store`. |
| **Consultar por ID** | `GET` | `/api/incidentes/:id` | ✅ | ✅ | ✅ | Validación defensiva: ID entero > 0. |
| **Crear Incidente** | `POST` | `/api/incidentes` | ✅ | ❌ | ✅ | Sanitización anti-XSS y validación Zod. |
| **Actualizar Estado** | `PUT` | `/api/incidentes/:id` | ❌ | ✅ | ✅ | Obligatorio ingresar resolución técnica (mín. 5 chars) para cerrar. |
| **Eliminar Incidente**| `DELETE`| `/api/incidentes/:id` | ❌ | ❌ | ✅ | Operación crítica restringida a administradores. |

---

## 📖 Documentación Detallada de Despliegue
Para instrucciones exhaustivas de despliegue en servidores VPS (Ubuntu, Systemd, PM2, Certbot SSL) y proveedores Cloud (Railway, Render, AWS), consulte el archivo:
👉 [**GUIA_DESPLIEGUE.md**](file:///c:/Desarrollo%20de%20Plataformas/UNIFICADO/GUIA_DESPLIEGUE.md)
