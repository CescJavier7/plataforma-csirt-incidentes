# 🎬 Guion Estructurado para el Video de Defensa Técnica (10 - 20 Minutos)

**Proyecto:** Plataforma Web para la Gestión de Incidentes de Ciberseguridad (CSIRT / SOC)  
**Objetivo del Video:** Demostrar de forma rigurosa y ordenada el funcionamiento de la plataforma en producción, la arquitectura implementada, las defensas de ciberseguridad activas (OWASP Top 10) y la ejecución de pruebas automatizadas.

---

## ⏱️ Cronograma y Estructura del Video

| Tiempo (10 min) | Tiempo (20 min) | Bloque / Sección | Contenido y Demostración Práctica |
| :---: | :---: | :--- | :--- |
| **00:00 - 01:00** | 00:00 - 02:30 | **1. Introducción y Problema** | Contexto CSIRT/SOC, taxonomía de incidentes NIST SP 800-61 / ITIL y alcance de la solución integradora. |
| **01:00 - 03:00** | 02:30 - 06:00 | **2. Arquitectura de Software** | Frontend SPA modular, API REST MVC en Node.js, capa de persistencia Prisma ORM con MySQL 8.4 y proxy perimetral Nginx. |
| **03:00 - 05:00** | 06:00 - 11:30 | **3. Ciberseguridad Defensiva** | Demostración de RBAC en backend (403 a Analista en DELETE), mitigación de enumeración (401 genérico), sanitización XSS (Zod + sanitize-html) y secretos protegidos. |
| **05:00 - 07:00** | 11:30 - 14:00 | **4. Demostración Operativa** | Flujo completo de incidentes: creación como Analista, actualización de estado a CERRADO por Supervisor con resolución técnica ($\ge 5$ caracteres) y eliminación por Administrador. |
| **07:00 - 09:00** | 14:00 - 18:30 | **5. Pruebas y Monitoreo** | Ejecución de `npm test` (18 pruebas), validación de endpoints `/health` y `/ready`, logs de auditoría estructurados con `correlationId` y script de humo `verificar-entrega.js`. |
| **09:00 - 10:00** | 18:30 - 20:00 | **6. Conclusiones y Retrospectiva** | Lecciones aprendidas, principios de menor privilegio aplicados y plan de contingencia ante fallos. |

---

### 🛡️ Plan de Contingencia ante Contingencias en Vivo (Fase 6 SKILL.md)
Si la conexión en vivo al servicio en la nube experimenta latencia o caída del proveedor:
1. **Evidencias previas**: Mostrar los reportes automáticos de pruebas en `docs/PRUEBAS.md` y `evidencias/pruebas/REPORTE_PRUEBAS.md`.
2. **Entorno local de réplica**: Demostrar la ejecución idéntica mediante `PROYECTO_FINAL_PRODUCCION` en memoria o Docker local (`docker compose up -d`).
3. **Trazabilidad y Logs**: Exhibir los logs estructurados con `CORRELATION_ID` y códigos HTTP 401/403/200 capturados en las pruebas de integración.
4. **Validación del Contrato**: Demostrar mediante cURL o `scripts/verificar-entrega.js` la respuesta unívoca del servidor.
