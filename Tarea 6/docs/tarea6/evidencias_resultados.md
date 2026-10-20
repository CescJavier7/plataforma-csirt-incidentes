# Evidencias automáticas – Pruebas de seguridad (Tarea 6)

> Generado por `tests/seguridad.test.js` el 19/10/2026, 6:16:23 p. m.. Persistencia: memoria.

### Caso 1: Acceso sin token

**Entrada**
```http
GET /api/incidentes
```
**Resultado esperado:** 401 Unauthorized – "Token de acceso requerido"

**Resultado obtenido:** HTTP `401`
```json
{
  "success": false,
  "message": "Token de acceso requerido",
  "error": "UNAUTHORIZED"
}
```

### Caso 2: Permisos insuficientes (ANALISTA → DELETE)

**Entrada**
```http
DELETE /api/incidentes/1
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…Eh0Upydgzs
```
**Resultado esperado:** 403 Forbidden – solo ADMIN puede eliminar

**Resultado obtenido:** HTTP `403`
```json
{
  "success": false,
  "message": "Acceso denegado: se requiere uno de los roles [ADMIN]",
  "error": "FORBIDDEN"
}
```

### Caso 3: Datos inválidos (Login)

**Entrada**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "correo-sin-arroba",
  "password": "123"
}
```
**Resultado esperado:** 400 Bad Request con errores de Zod por campo

**Resultado obtenido:** HTTP `400`
```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    {
      "campo": "email",
      "mensaje": "El correo no tiene un formato válido"
    },
    {
      "campo": "password",
      "mensaje": "La contraseña debe tener al menos 8 caracteres"
    }
  ]
}
```

### Caso 4: Datos inválidos (Creación)

**Entrada**
```http
POST /api/incidentes
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…Eh0Upydgzs

{
  "titulo": 123,
  "prioridad": "URGENTE"
}
```
**Resultado esperado:** 400 Bad Request: titulo debe ser string, descripcion obligatoria, prioridad fuera del enum

**Resultado obtenido:** HTTP `400`
```json
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    {
      "campo": "titulo",
      "mensaje": "El título debe ser texto"
    },
    {
      "campo": "descripcion",
      "mensaje": "La descripción es obligatoria"
    },
    {
      "campo": "prioridad",
      "mensaje": "La prioridad debe ser BAJA, MEDIA, ALTA o CRITICA"
    }
  ]
}
```

### Caso 5: Limpieza de entradas (sanitize-html)

**Entrada**
```http
POST /api/incidentes
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…Eh0Upydgzs

{
  "titulo": "<script>alert(\"XSS\")</script>Caída del servidor web",
  "descripcion": "<img src=x onerror=\"alert(1)\">El portal no responde <b>desde las 8:00</b>",
  "prioridad": "ALTA"
}
```
**Resultado esperado:** 201 Created; el título y la descripción se guardan SIN etiquetas ni código JavaScript

**Resultado obtenido:** HTTP `201`
```json
{
  "success": true,
  "message": "Incidente creado exitosamente",
  "data": {
    "id": 2,
    "titulo": "Caída del servidor web",
    "descripcion": "El portal no responde desde las 8:00",
    "resolucion": null,
    "prioridad": "ALTA",
    "estado": "ABIERTO",
    "createdAt": "2026-10-19T23:16:23.318Z",
    "updatedAt": "2026-10-19T23:16:23.318Z"
  }
}
```
**Verificación adicional:**

```text
Consulta posterior GET /api/incidentes/2 confirma el valor persistido.
```

### Caso 6: Flujo exitoso – Login

**Entrada**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "analista@incidentes.com",
  "password": "Analista123!"
}
```
**Resultado esperado:** 200 OK con token JWT, tipo Bearer y datos del usuario (sin contraseña)

**Resultado obtenido:** HTTP `200`
```json
{
  "success": true,
  "message": "Inicio de sesión exitoso",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs…Eh0Upydgzs",
    "tipo": "Bearer",
    "usuario": {
      "id": 3,
      "nombre": "Laura Analista",
      "email": "analista@incidentes.com",
      "rol": "ANALISTA"
    }
  }
}
```

### Caso 7: Flujo exitoso – Crear y Consultar

**Entrada**
```http
POST /api/incidentes
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…Eh0Upydgzs

{
  "titulo": "Fallo en VPN corporativa",
  "descripcion": "Usuarios remotos no logran conectarse a la VPN",
  "prioridad": "CRITICA"
}
```
**Resultado esperado:** 201 Created y el incidente aparece en GET /api/incidentes (fila en la tabla del cliente)

**Resultado obtenido:** HTTP `201`
```json
{
  "success": true,
  "message": "Incidente creado exitosamente",
  "data": {
    "id": 3,
    "titulo": "Fallo en VPN corporativa",
    "descripcion": "Usuarios remotos no logran conectarse a la VPN",
    "resolucion": null,
    "prioridad": "CRITICA",
    "estado": "ABIERTO",
    "createdAt": "2026-10-19T23:16:23.347Z",
    "updatedAt": "2026-10-19T23:16:23.347Z"
  }
}
```
**Verificación adicional:**

```text
GET /api/incidentes → 200, total=3; fila encontrada: { id: 3, titulo: "Fallo en VPN corporativa", prioridad: CRITICA, estado: ABIERTO }
```

### Caso 8: Flujo exitoso – Actualizar (SUPERVISOR)

**Entrada**
```http
PUT /api/incidentes/3
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…85Mnwf_TUU

{
  "estado": "EN_PROCESO"
}
```
**Resultado esperado:** 200 OK con estado = EN_PROCESO

**Resultado obtenido:** HTTP `200`
```json
{
  "success": true,
  "message": "Incidente actualizado exitosamente",
  "data": {
    "id": 3,
    "titulo": "Fallo en VPN corporativa",
    "descripcion": "Usuarios remotos no logran conectarse a la VPN",
    "resolucion": null,
    "prioridad": "CRITICA",
    "estado": "EN_PROCESO",
    "createdAt": "2026-10-19T23:16:23.347Z",
    "updatedAt": "2026-10-19T23:16:23.379Z"
  }
}
```

### Caso 9: Token manipulado (rol cambiado a ADMIN)

**Entrada**
```http
DELETE /api/incidentes/3
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…Eh0Upydgzs
```
**Resultado esperado:** 401 – la firma ya no coincide, el servidor rechaza el token

**Resultado obtenido:** HTTP `401`
```json
{
  "success": false,
  "message": "Token inválido",
  "error": "INVALID_TOKEN"
}
```

### Caso 10: Contraseña incorrecta

**Entrada**
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@incidentes.com",
  "password": "ClaveEquivocada1"
}
```
**Resultado esperado:** 401 "Credenciales inválidas" (no revela qué campo falló)

**Resultado obtenido:** HTTP `401`
```json
{
  "success": false,
  "message": "Credenciales inválidas",
  "error": "INVALID_CREDENTIALS"
}
```

### Caso 11: Permisos insuficientes (SUPERVISOR → POST)

**Entrada**
```http
POST /api/incidentes
Content-Type: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…85Mnwf_TUU

{
  "titulo": "Intento no autorizado",
  "descripcion": "El supervisor no puede crear incidentes"
}
```
**Resultado esperado:** 403 Forbidden – POST solo para ANALISTA y ADMIN

**Resultado obtenido:** HTTP `403`
```json
{
  "success": false,
  "message": "Acceso denegado: se requiere uno de los roles [ANALISTA, ADMIN]",
  "error": "FORBIDDEN"
}
```

### Caso 12: CORS restringido (origen no autorizado)

**Entrada**
```http
GET /api/health
Origin: http://sitio-malicioso.com
```
**Resultado esperado:** 403 y SIN cabecera Access-Control-Allow-Origin

**Resultado obtenido:** HTTP `403`
```json
{
  "success": false,
  "message": "Origen no permitido por CORS: http://sitio-malicioso.com",
  "error": "CORS_NOT_ALLOWED"
}
```
**Verificación adicional:**

```text
Access-Control-Allow-Origin = (ausente) | Con Origin http://localhost:5500 → 200, Access-Control-Allow-Origin = http://localhost:5500
```

### Caso 13: Cabeceras de seguridad (Helmet)

**Entrada**
```http
GET /api/health
```
**Resultado esperado:** Cabeceras CSP, HSTS, X-Content-Type-Options, X-Frame-Options; sin X-Powered-By

**Resultado obtenido:** HTTP `200`
```json
{
  "status": "UP",
  "timestamp": "2026-10-19T23:16:23.502Z"
}
```
**Verificación adicional:**

```text
content-security-policy: default-src 'self';base-uri 'self';font-src 'self' https: data:;form-action 'self';frame-ancestors 'self';img-src 'self' data:;object-src 'none';script-src 'self';script-src-attr 'none';style-src 'self' https: 'unsafe-inline';upgrade-insecure-requests
strict-transport-security: max-age=31536000; includeSubDomains
x-content-type-options: nosniff
x-frame-options: SAMEORIGIN
x-powered-by: (ausente)
```

### Caso 14: Flujo exitoso – Eliminar (ADMIN)

**Entrada**
```http
DELETE /api/incidentes/3
Authorization: Bearer eyJhbGciOiJIUzI1NiIs…VgkcoD6iQ8
```
**Resultado esperado:** 200 OK y el recurso deja de existir (GET posterior → 404)

**Resultado obtenido:** HTTP `200`
```json
{
  "success": true,
  "message": "Incidente eliminado exitosamente",
  "data": {
    "id": 3
  }
}
```
**Verificación adicional:**

```text
GET /api/incidentes/3 posterior → 404 (INCIDENTE_NO_ENCONTRADO)
```
