# 🧪 Matriz de Pruebas Automatizadas y de Seguridad

## 1. Resumen de Ejecución de Pruebas

La plataforma cuenta con 17 pruebas automatizadas que cubren el 100% de los requisitos de negocio, ciberseguridad y contratos de la API definidos en `skill_seguridad.md`:

| # | Suite / Módulo | Caso de Prueba | Enfoque OWASP / ITIL | Código Esperado | Estado |
| :-: | :--- | :--- | :--- | :-: | :-: |
| 1 | **Unitarias (Estado)** | Rechazo de cierre si resolución técnica está vacía | Regla de Negocio / Defecto 1 | `valido: false` | ✅ PASS |
| 2 | **Unitarias (Estado)** | Permite cierre cuando se provee resolución técnica válida | Ciclo de Vida ITIL | `valido: true` | ✅ PASS |
| 3 | **Unitarias (Estado)** | Bloqueo de reapertura de un incidente en estado CERRADO | Integridad de Evidencias | `valido: false` | ✅ PASS |
| 4 | **Unitarias (Estado)** | Rechazo de transiciones a estados inválidos | Validación de Dominio | `valido: false` | ✅ PASS |
| 5 | **Unitarias (Estado)** | Transición operativa regular (ABIERTO -> EN_PROCESO -> RESUELTO) | Flujo Operativo Normal | `valido: true` | ✅ PASS |
| 6 | **Integración** | Health check público (`GET /health`) | A09 Monitoreo | `200 OK` | ✅ PASS |
| 7 | **Seguridad** | Acceso a rutas protegidas sin cabecera Authorization | A01 Broken Access Control | `401 Unauthorized` | ✅ PASS |
| 8 | **Seguridad** | Login con credenciales inválidas (mitigación de enumeración) | A07 Identificación | `401 Unauthorized` | ✅ PASS |
| 9 | **Seguridad** | Emisión de token JWT con algoritmo forzado `HS256` para cada rol | A04 Fallos Criptográficos | `200 OK` | ✅ PASS |
| 10 | **Seguridad** | Sanitización de entradas: tags `<script>` y `<img>` eliminados | A05 Inyección XSS | `201 Created` | ✅ PASS |
| 11 | **Rendimiento** | Lista de incidentes entrega cabecera `Cache-Control` | Optimización HTTP | `200 OK` | ✅ PASS |
| 12 | **Seguridad** | Defensiva de parámetros: IDs no numéricos o negativos | Validación Defensiva | `400 Bad Request` | ✅ PASS |
| 13 | **Seguridad** | RBAC: Analista intenta `DELETE` y es bloqueado con 403 | Principio Menor Privilegio | `403 Forbidden` | ✅ PASS |
| 14 | **Seguridad** | Intento de cerrar vía API sin resolución es rechazado | A01 / Regla de Negocio | `400 Bad Request` | ✅ PASS |
| 15 | **Operación** | Supervisor actualiza a CERRADO con resolución técnica | ITIL Cierre Verificado | `200 OK` | ✅ PASS |
| 16 | **Seguridad** | RBAC: Administrador elimina incidente exitosamente | Control de Acceso | `200 OK` | ✅ PASS |
| 17 | **Seguridad** | Cabeceras HTTP emitidas por Helmet (CSP, HSTS, X-Frame-Options) | A02 Misconfiguration | Cabeceras activas | ✅ PASS |

---

## 2. Comandos de Reproducción
```bash
cd codigo/server
npm test
```
*Tiempo promedio de ejecución:* 600 - 850 ms.
*Tasa de éxito:* 100% (17 aprobadas, 0 fallidas).

