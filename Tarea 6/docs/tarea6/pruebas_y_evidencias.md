# Tarea 6 – Registro de Pruebas y Evidencias

**Proyecto:** Plataforma de Incidentes (API Node/Express + Cliente HTML/JS)
**Herramienta:** `node --test tests/seguridad.test.js` (API real levantada en puerto efímero) + verificación manual en navegador
**Resultado global:** ✅ 14/14 pruebas superadas (8 obligatorias + 6 adicionales)

> El registro HTTP completo (cabeceras, cuerpos de petición y respuesta) se genera automáticamente en
> [evidencias_resultados.md](evidencias_resultados.md) cada vez que se ejecuta `npm run test:seguridad`.

---

## 1. Usuarios de prueba

| Rol | Correo | Contraseña | Permisos sobre `/api/incidentes` |
|---|---|---|---|
| ADMIN | admin@incidentes.com | `ADMIN_PASSWORD` (entorno) | GET, POST, PUT, DELETE |
| SUPERVISOR | supervisor@incidentes.com | `SUPERVISOR_PASSWORD` (entorno) | GET, PUT |
| ANALISTA | analista@incidentes.com | `ANALISTA_PASSWORD` (entorno) | GET, POST |

## 2. Resumen de casos

| # | Caso | Entrada | Esperado | Obtenido | Estado |
|---|---|---|---|---|---|
| 1 | Acceso sin token | `GET /api/incidentes` sin `Authorization` | 401 | **401** `UNAUTHORIZED` | ✅ |
| 2 | Permisos insuficientes | `DELETE /api/incidentes/1` con token ANALISTA | 403 | **403** `FORBIDDEN` | ✅ |
| 3 | Datos inválidos (login) | `{"email":"correo-sin-arroba","password":"123"}` | 400 (Zod) | **400**, errores en `email` y `password` | ✅ |
| 4 | Datos inválidos (creación) | `{"titulo":123,"prioridad":"URGENTE"}` | 400 | **400**, errores en `titulo`, `descripcion`, `prioridad` | ✅ |
| 5 | Limpieza de entradas | Título con `<script>alert("XSS")</script>` | Guardado sin etiquetas | **201**, `titulo = "Caída del servidor web"` | ✅ |
| 6 | Login exitoso | Credenciales válidas ANALISTA | 200 + JWT | **200**, token `eyJhbGci…`, rol ANALISTA | ✅ |
| 7 | Crear y consultar | `POST` como ANALISTA, luego `GET` | 201 + fila visible | **201**; `GET` → 200 con la fila | ✅ |
| 8 | Actualizar estado | `PUT /api/incidentes/3 {"estado":"EN_PROCESO"}` como SUPERVISOR | 200 | **200**, `estado = EN_PROCESO` | ✅ |
| 9 | Token manipulado | JWT con `rol` cambiado a ADMIN sin re-firmar | 401 | **401** `INVALID_TOKEN` | ✅ |
| 10 | Contraseña incorrecta | `admin@…` + clave errónea | 401 genérico | **401** "Credenciales inválidas" | ✅ |
| 11 | SUPERVISOR intenta crear | `POST` con token SUPERVISOR | 403 | **403** `FORBIDDEN` | ✅ |
| 12 | CORS restringido | `Origin: http://sitio-malicioso.com` | Rechazado | **403**, sin `Access-Control-Allow-Origin` | ✅ |
| 13 | Cabeceras Helmet | `GET /api/health` | CSP, HSTS, nosniff… | Presentes; `X-Powered-By` ausente | ✅ |
| 14 | Eliminar (ADMIN) | `DELETE /api/incidentes/3` con token ADMIN | 200, luego 404 | **200**; GET posterior → **404** | ✅ |

---

## 3. Detalle de los casos obligatorios

### Caso 1 – Acceso sin token
- **Entrada:** `GET http://localhost:3000/api/incidentes` (sin cabecera `Authorization`).
- **Resultado esperado:** `401 Unauthorized`.
- **Resultado obtenido:**
```json
HTTP 401
{ "success": false, "message": "Token de acceso requerido", "error": "UNAUTHORIZED" }
```
- **Cliente web:** si el token expira o se borra, `api.js` detecta el 401 y regresa automáticamente a la pantalla de login.

### Caso 2 – Permisos insuficientes (ANALISTA intenta eliminar)
- **Entrada:** `DELETE /api/incidentes/1` con `Authorization: Bearer <token ANALISTA>`.
- **Resultado esperado:** `403 Forbidden`.
- **Resultado obtenido:**
```json
HTTP 403
{ "success": false, "message": "Acceso denegado: se requiere uno de los roles [ADMIN]", "error": "FORBIDDEN" }
```
- **Observación:** el cliente oculta el botón "Eliminar" al ANALISTA, pero la prueba demuestra que, aunque se fuerce la petición (Postman/consola), el servidor la bloquea.

### Caso 3 – Datos inválidos en login
- **Entrada:** `POST /api/auth/login` con `{ "email": "correo-sin-arroba", "password": "123" }`.
- **Resultado esperado:** `400 Bad Request` generado por Zod.
- **Resultado obtenido:**
```json
HTTP 400
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    { "campo": "email", "mensaje": "El correo no tiene un formato válido" },
    { "campo": "password", "mensaje": "La contraseña debe tener al menos 8 caracteres" }
  ]
}
```

### Caso 4 – Datos inválidos al crear incidente
- **Entrada:** `POST /api/incidentes` (token ANALISTA) con `{ "titulo": 123, "prioridad": "URGENTE" }`.
- **Resultado esperado:** `400` indicando tipo incorrecto, campo faltante y valor fuera de enumeración.
- **Resultado obtenido:**
```json
HTTP 400
{
  "success": false,
  "message": "Datos de entrada inválidos",
  "errors": [
    { "campo": "titulo", "mensaje": "El título debe ser texto" },
    { "campo": "descripcion", "mensaje": "La descripción es obligatoria" },
    { "campo": "prioridad", "mensaje": "La prioridad debe ser BAJA, MEDIA, ALTA o CRITICA" }
  ]
}
```

### Caso 5 – Limpieza de entradas con sanitize-html
- **Entrada:**
```json
POST /api/incidentes   (token ANALISTA)
{
  "titulo": "<script>alert(\"XSS\")</script>Caída del servidor web",
  "descripcion": "<img src=x onerror=\"alert(1)\">El portal no responde <b>desde las 8:00</b>",
  "prioridad": "ALTA"
}
```
- **Resultado esperado:** el incidente se guarda **sin** etiquetas HTML ni código JavaScript.
- **Resultado obtenido:**
```json
HTTP 201
{ "data": { "id": 2, "titulo": "Caída del servidor web",
            "descripcion": "El portal no responde desde las 8:00", "prioridad": "ALTA", "estado": "ABIERTO" } }
```
- **Verificación:** `GET /api/incidentes/2` devuelve los mismos valores limpios; no contienen `<` ni `>`.

### Caso 6 – Login exitoso
- **Entrada:** `POST /api/auth/login` con `{ "email": "analista@incidentes.com", "password": "$ANALISTA_PASSWORD" }`.
- **Resultado esperado:** `200 OK` con JWT y datos del usuario sin contraseña.
- **Resultado obtenido:**
```json
HTTP 200
{ "success": true, "message": "Inicio de sesión exitoso",
  "data": { "token": "eyJhbGciOiJIUzI1NiIs…", "tipo": "Bearer",
            "usuario": { "id": 3, "nombre": "Laura Analista", "email": "analista@incidentes.com", "rol": "ANALISTA" } } }
```
- **Cliente web:** el token y el rol se guardan en `sessionStorage`; aparece el panel con el nombre y la insignia del rol.

### Caso 7 – Crear como ANALISTA y consultar
- **Entrada:** `POST /api/incidentes` con `{ "titulo": "Fallo en VPN corporativa", "descripcion": "Usuarios remotos no logran conectarse a la VPN", "prioridad": "CRITICA" }`.
- **Resultado esperado:** `201 Created` y nueva fila en la tabla.
- **Resultado obtenido:** `201` con `id: 3, estado: ABIERTO`. A continuación `GET /api/incidentes` → `200`, la fila `{ id: 3, titulo: "Fallo en VPN corporativa", prioridad: CRITICA, estado: ABIERTO }` está presente.
- **Cliente web:** tras pulsar "Crear" aparece el mensaje "Incidente #3 creado" y la fila se dibuja en la tabla.

### Caso 8 – Actualizar estado como SUPERVISOR
- **Entrada:** `PUT /api/incidentes/3` (token SUPERVISOR) con `{ "estado": "EN_PROCESO" }`.
- **Resultado esperado:** `200 OK`.
- **Resultado obtenido:**
```json
HTTP 200
{ "success": true, "message": "Incidente actualizado exitosamente",
  "data": { "id": 3, "estado": "EN_PROCESO", "updatedAt": "2026-10-10T14:14:14.934Z" } }
```

---

## 4. Cómo reproducir

```powershell
# 1. Pruebas automatizadas (regeneran evidencias_resultados.md)
npm run test:seguridad

# 2. Prueba manual en navegador (dos terminales)
npm start          # API  -> http://localhost:3000  (PERSISTENCE=memory o prisma en .env)
npm run client     # Web  -> http://localhost:5500
```

**Guion manual sugerido para capturas de pantalla:**
1. Abrir `http://localhost:5500` → formulario de login.
2. Ingresar `correo-sin-arroba` / `123` → mensaje rojo con los errores de Zod (Caso 3).
3. Ingresar como **analista** → panel visible, sin botones "Guardar estado" ni "Eliminar" (Caso 6).
4. Crear incidente con título `<script>alert(1)</script>Prueba XSS` → la fila muestra solo "Prueba XSS" y no se ejecuta ninguna alerta (Casos 5 y 7).
5. Cerrar sesión, entrar como **supervisor**, cambiar estado a EN_PROCESO y pulsar "Guardar estado" → mensaje verde (Caso 8).
6. En DevTools → Network, revisar la cabecera `Authorization: Bearer …` y la respuesta del preflight `OPTIONS` con `Access-Control-Allow-Origin: http://localhost:5500`.
7. En DevTools → Application → Session Storage, borrar `incidentes.token` y pulsar "Refrescar" → la app regresa al login por el 401 (Caso 1).
