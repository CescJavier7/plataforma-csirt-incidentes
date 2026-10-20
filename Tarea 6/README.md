# Plataforma de Gestión de Incidentes · Tarea 6
## Unidad 6: Seguridad, Autenticación (JWT), Autorización (RBAC), CORS, HTTPS, Validación e Integración Cliente-Servidor

Plataforma integral de gestión y triaje de incidentes con arquitectura cliente-servidor desacoplada, seguridad en profundidad y persistencia mediante Prisma ORM.

---

## 1. Características Implementadas en la Tarea 6

* **Autenticación con JWT:** Tokens firmados con algoritmo estricto `HS256`, emisor verificado y tiempo de expiración (1 hora).
* **Control de Acceso Basado en Roles (RBAC):**
  * `ADMIN`: Acceso total (GET, POST, PUT, DELETE).
  * `SUPERVISOR`: Consulta y actualización de estado (GET, PUT).
  * `ANALISTA`: Consulta y creación de incidentes (GET, POST).
* **Hashing de Contraseñas:** Encriptación con `bcryptjs` (salt rounds = 10) y mitigación de ataques de tiempo (*timing attacks*).
* **Seguridad Perimetral:**
  * Cabeceras HTTP blindadas con `helmet` (CSP, HSTS, X-Content-Type-Options, X-Frame-Options; supresión de `X-Powered-By`).
  * CORS estricto limitado a orígenes autorizados (`CLIENT_ORIGIN`).
  * Limitador de tasa contra fuerza bruta y DoS con `express-rate-limit`.
* **Validación y Sanitización:**
  * Limpieza previa de HTML y scripts maliciosos con `sanitize-html` para prevenir XSS Almacenado.
  * Validación tipada de esquemas de entrada mediante `zod`.
* **Cliente Web Seguro:**
  * Consumo mediante Fetch API con interceptor de token Bearer en `Authorization`.
  * Renderizado mediante `textContent` y plantillas `<template>` (cero inyección por `innerHTML`).
  * Almacenamiento efímero de sesión en `sessionStorage`.

---

## 2. Usuarios de Demostración

| Rol | Correo Electrónico | Contraseña | Permisos sobre `/api/incidentes` |
|---|---|---|---|
| **ADMIN** | `admin@incidentes.com` | `Admin123!` | GET, POST, PUT, DELETE |
| **SUPERVISOR** | `supervisor@incidentes.com` | `Supervisor123!` | GET, PUT |
| **ANALISTA** | `analista@incidentes.com` | `Analista123!` | GET, POST |

---

## 3. Instrucciones de Ejecución

### 3.1 Instalación de dependencias
```bash
npm install
```

### 3.2 Iniciar la API Backend (Puerto 3000)
```bash
npm start
```
* API Endpoint: `http://localhost:3000/api/incidentes`
* Healthcheck: `http://localhost:3000/api/health`

### 3.3 Iniciar el Cliente Web Frontend (Puerto 5500)
En una terminal separada:
```bash
npm run client
```
* Acceso web: `http://localhost:5500`

### 3.4 Ejecutar Suite de Pruebas Automatizadas
```bash
npm test
```
Ejecuta los 14 casos de prueba automatizados verificando el 100% de los requisitos de seguridad y regenera el registro de evidencias en `docs/tarea6/evidencias_resultados.md`.

---

## 4. Entregables Académicos

* **Documento PDF Oficial:** [`docs/tarea6/informe_final_tarea6.pdf`](docs/tarea6/informe_final_tarea6.pdf)
* **Informe Técnico en Markdown:** [`docs/tarea6/informe_tarea6.md`](docs/tarea6/informe_tarea6.md)
* **Registro de Casos de Prueba:** [`docs/tarea6/pruebas_y_evidencias.md`](docs/tarea6/pruebas_y_evidencias.md)
* **Paquete de Entrega (.zip):** `Tarea_6_Entrega.zip`
