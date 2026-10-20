# 🔌 Especificación de la API REST y Contratos de Datos

Todos los endpoints (salvo `/health` y `/api/auth/login`) requieren la cabecera HTTP:
`Authorization: Bearer <TOKEN_JWT>`

---

## 1. Monitoreo y Salud

### `GET /health`
* **Descripción:** Endpoint público para comprobación de estado y monitoreo por orquestadores.
* **Respuesta 200 OK:**
```json
{
  "estado": "ok",
  "persistence": "prisma",
  "timestamp": "2026-10-19T23:30:00.000Z"
}
```

---

## 2. Autenticación y Sesiones

### `POST /api/auth/login`
* **Límite de tasa:** Máximo 10 peticiones cada 15 minutos por IP.
* **Cuerpo de la Solicitud:**
```json
{
  "email": "analista@incidentes.com",
  "password": "Analista123!"
}
```
* **Respuesta 200 OK:**
```json
{
  "success": true,
  "message": "Autenticación exitosa",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "usuario": {
      "id": 3,
      "nombre": "Laura Analista Nivel 1",
      "email": "analista@incidentes.com",
      "rol": "ANALISTA"
    }
  }
}
```
* **Respuesta 401 Unauthorized (Prevención de Enumeración):**
```json
{
  "error": "Credenciales incorrectas"
}
```

---

## 3. Gestión de Incidentes

### `GET /api/incidentes`
* **Roles Autorizados:** `Analista`, `Supervisor`, `Administrador`.
* **Parámetros Opcionales de Consulta:** `?estado=EN_PROCESO&prioridad=CRITICA`
* **Cabecera de Respuesta:** `Cache-Control: public, max-age=60`
* **Respuesta 200 OK:**
```json
{
  "success": true,
  "total": 1,
  "data": [
    {
      "id": 1,
      "titulo": "Intento de intrusión por fuerza bruta SSH",
      "descripcion": "Detección de más de 500 intentos de autenticación fallida.",
      "prioridad": "ALTA",
      "estado": "EN_PROCESO",
      "resolucion": null,
      "createdAt": "2026-10-19T10:00:00.000Z",
      "updatedAt": "2026-10-19T10:30:00.000Z"
    }
  ]
}
```

### `POST /api/incidentes`
* **Roles Autorizados:** `Analista`, `Supervisor`, `Administrador`.
* **Cuerpo de la Solicitud:**
```json
{
  "titulo": "Detección de troyano bancario en workstation",
  "descripcion": "Se identificó binario sospechoso firmado con certificado revocado.",
  "prioridad": "ALTA"
}
```
* **Respuesta 201 Created:**
```json
{
  "success": true,
  "message": "Incidente creado exitosamente",
  "data": {
    "id": 6,
    "titulo": "Detección de troyano bancario en workstation",
    "descripcion": "Se identificó binario sospechoso firmado con certificado revocado.",
    "prioridad": "ALTA",
    "estado": "ABIERTO",
    "createdAt": "2026-10-19T18:40:00.000Z"
  }
}
```

### `PUT /api/incidentes/:id`
* **Roles Autorizados:** `Supervisor`, `Administrador`.
* **Cuerpo para Cierre (Exige Resolución Técnica $\ge 5$ caracteres):**
```json
{
  "estado": "CERRADO",
  "resolucion": "Estación desconectada de VLAN operativa, disco formateado e imagen base restablecida."
}
```
* **Respuesta 200 OK:**
```json
{
  "success": true,
  "message": "Incidente actualizado exitosamente",
  "data": { ... }
}
```
* **Respuesta 400 Bad Request (Si falta resolución al cerrar):**
```json
{
  "error": "Para cerrar un incidente es obligatorio ingresar una resolución de al menos 5 caracteres"
}
```

### `DELETE /api/incidentes/:id`
* **Roles Autorizados:** Exclusivo `Administrador`.
* **Respuesta 200 OK:**
```json
{
  "success": true,
  "message": "Incidente eliminado exitosamente",
  "data": { "id": 6 }
}
```
* **Respuesta 403 Forbidden (Si lo ejecuta Analista o Supervisor):**
```json
{
  "error": "Permiso insuficiente para realizar esta acción"
}
```

