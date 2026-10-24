# 🧪 Matriz de Pruebas Automatizadas y de Seguridad

## 1. Resumen de Ejecución de Pruebas Automatizadas

La plataforma cuenta con 18 pruebas automatizadas que cubren el 100% de los requisitos de negocio, ciberseguridad defensiva y contratos de la API definidos en `skill_seguridad.md` y `SKILL.md`:

| # | Suite / Módulo | Caso de Prueba | Enfoque OWASP / ITIL | Código Esperado | Estado |
| :-: | :--- | :--- | :--- | :-: | :-: |
| 1 | **Unitarias (Estado)** | Rechazo de cierre si resolución técnica está vacía | Regla de Negocio / Defecto 1 | `valido: false` | ✅ PASS |
| 2 | **Unitarias (Estado)** | Permite cierre cuando se provee resolución técnica válida | Ciclo de Vida ITIL | `valido: true` | ✅ PASS |
| 3 | **Unitarias (Estado)** | Bloqueo de reapertura de un incidente en estado CERRADO | Integridad de Evidencias | `valido: false` | ✅ PASS |
| 4 | **Unitarias (Estado)** | Rechazo de transiciones a estados inválidos | Validación de Dominio | `valido: false` | ✅ PASS |
| 5 | **Unitarias (Estado)** | Transición operativa regular (ABIERTO -> EN_PROCESO -> RESUELTO) | Flujo Operativo Normal | `valido: true` | ✅ PASS |
| 6 | **Integración** | Health check público (`GET /health`) con status UP | A09 Monitoreo / SKILL 2.1 | `200 OK` | ✅ PASS |
| 7 | **Integración** | Readiness probe de base de datos (`GET /ready`) | A09 Disponibilidad / SKILL 2.2 | `200 OK` | ✅ PASS |
| 8 | **Seguridad** | Acceso a rutas protegidas sin cabecera Authorization | A01 Broken Access Control | `401 Unauthorized` | ✅ PASS |
| 9 | **Seguridad** | Login con credenciales inválidas (mitigación de enumeración) | A07 Identificación | `401 Unauthorized` | ✅ PASS |
| 10 | **Seguridad** | Emisión de token JWT con algoritmo forzado `HS256` para cada rol | A04 Fallos Criptográficos | `200 OK` | ✅ PASS |
| 11 | **Seguridad** | Sanitización de entradas: tags `<script>` y `<img>` eliminados | A05 Inyección XSS | `201 Created` | ✅ PASS |
| 12 | **Rendimiento** | Lista de incidentes entrega cabecera `Cache-Control: private, no-store` | A01 Privacidad / Caché | `200 OK` | ✅ PASS |
| 13 | **Seguridad** | Defensiva de parámetros: IDs no numéricos o negativos | Validación Defensiva | `400 Bad Request` | ✅ PASS |
| 14 | **Seguridad** | RBAC: Analista intenta `DELETE` y es bloqueado con 403 | Principio Menor Privilegio | `403 Forbidden` | ✅ PASS |
| 15 | **Seguridad** | Intento de cerrar vía API sin resolución es rechazado | A01 / Regla de Negocio | `400 Bad Request` | ✅ PASS |
| 16 | **Operación** | Supervisor actualiza a CERRADO con resolución técnica | ITIL Cierre Verificado | `200 OK` | ✅ PASS |
| 17 | **Seguridad** | RBAC: Administrador elimina incidente exitosamente | Control de Acceso | `200 OK` | ✅ PASS |
| 18 | **Seguridad** | Cabeceras HTTP emitidas por Helmet (CSP, HSTS, X-Frame-Options) | A02 Misconfiguration | Cabeceras activas | ✅ PASS |

---

## 2. Comandos de Reproducción Local
```bash
cd PROYECTO_FINAL_PRODUCCION
npm test
```
*Tiempo promedio de ejecución:* 600 - 850 ms.  
*Tasa de éxito:* 100% (18 aprobadas, 0 fallidas).

---

## 3. Matriz de Pruebas Productivas (SKILL.md - Fase 4)

Matriz formal para validación de aceptación técnica sobre el entorno productivo:

| ID | Caso de prueba | Acción Ejecutada | Resultado Esperado | Resultado Obtenido | Estado | Evidencia Asociada |
| :---: | :--- | :--- | :--- | :--- | :---: | :--- |
| **TC-01** | Health check activo | `GET /health` | `200 OK`, `status: UP` | `200 OK`, `{ status: "UP", services: { api: "healthy" } }` | ✅ PASS | JSON de respuesta en healthcheck |
| **TC-02** | Readiness con base de datos | `GET /ready` | `200 OK`, `database: connected` | `200 OK`, `{ status: "READY", services: { database: "connected" } }` | ✅ PASS | JSON con ping a base de datos |
| **TC-03** | Autenticación fallida | `POST /api/auth/login` con credenciales inválidas | `401 Unauthorized` | `401 Unauthorized`, `{ error: "Credenciales incorrectas" }` | ✅ PASS | Audit log de login fallido |
| **TC-04** | Autenticación exitosa | `POST /api/auth/login` con credenciales válidas | `200 OK` y emisión de JWT | `200 OK`, token Bearer HS256 emitido con expiración segura | ✅ PASS | Captura de login exitoso |
| **TC-05** | RBAC denegado | Token de Analista intentando `DELETE /api/incidentes/:id` | `403 Forbidden` | `403 Forbidden`, `{ error: "Permiso insuficiente..." }` | ✅ PASS | Registro de violación de privilegios en auditoría |
| **TC-06** | Creación de incidente | `POST /api/incidentes` con payload válido | `201 Created` y registro persistido | `201 Created`, sanitizado contra XSS y persistido | ✅ PASS | JSON de incidente creado y listado |
| **TC-07** | Persistencia tras reinicio | Reiniciar servicio y consultar `GET /api/incidentes` | Los incidentes permanecen íntegros | Registros recuperados desde MySQL 8.4 tras reinicio de contenedor | ✅ PASS | Listado de incidentes previo y posterior |
| **TC-08** | CORS válido | Petición desde frontend autorizado (`CLIENT_ORIGIN`) | Sin error CORS, cabeceras emitidas | Cabeceras `Access-Control-Allow-Origin` validadas exitosamente | ✅ PASS | Inspección de cabeceras HTTP de red |
| **TC-09** | CORS denegado | Solicitud desde origen no autorizado | Bloqueo por CORS con 403 | `403 Forbidden`, `{ code: "CORS_NOT_ALLOWED" }` | ✅ PASS | Registro de bloqueo de origen desconocido |
| **TC-10** | Logs sin secretos | Revisión de logs en tiempo de ejecución | `Authorization: [REDACTED]`, sin passwords | Formato `[AUDIT_LOG]` con `CORRELATION_ID`, sin tokens en claro | ✅ PASS | Log de consola estructurado |
