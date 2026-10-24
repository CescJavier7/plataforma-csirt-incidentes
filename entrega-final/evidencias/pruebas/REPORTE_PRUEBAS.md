# 🧪 Evidencia de Pruebas Automatizadas y Análisis Estático de Código

**Fecha de Ejecución:** 2026-10-23  
**Entorno:** Node.js v24.19.0 / Express 4 / Prisma ORM / Jest / ESLint Flat Config  
**Resultado Global:** 100% de Pruebas Superadas (18 de 18) - 0 Advertencias ESLint  

---

## 1. Salida de la Suite de Pruebas Automatizadas (`npm test`)

```text
> plataforma-incidentes-csirt@1.0.0 test
> node --test tests/*.test.js

▶ Pruebas Unitarias - Máquina de Estados del Incidente (ITIL / Unidad 7)
  ✔ 1. Rechaza el cierre de un incidente si la resolución técnica está vacía (0.5209ms)
  ✔ 2. Permite el cierre cuando se provee una resolución técnica válida (0.0871ms)
  ✔ 3. No permite reactivar un incidente que ya se encuentra CERRADO (0.0786ms)
  ✔ 4. Rechaza transiciones hacia estados desconocidos o no válidos (0.0746ms)
  ✔ 5. Permite transiciones regulares operativas (ABIERTO -> EN_PROCESO -> RESUELTO) (0.0723ms)
✔ Pruebas Unitarias - Máquina de Estados del Incidente (ITIL / Unidad 7) (1.5698ms)

▶ Pruebas de Integración y Seguridad Defensiva (OWASP / skill_seguridad.md / SKILL.md)
  ✔ 1. Healthcheck público responde estado "ok" y status "UP" con timestamp (SKILL.md 2.1) (49.3601ms)
  ✔ 1.1 Readiness check responde 200 con base de datos conectada (SKILL.md 2.2) (3.684ms)
  ✔ 2. Acceso sin token responde 401 "Token de acceso requerido" (Sección 3.2) (3.8522ms)
  ✔ 3. Login con credenciales erróneas responde 401 "Credenciales incorrectas" (Sección A07) (239.7719ms)
  ✔ 4. Login exitoso genera token firmado con algoritmo forzado HS256 para cada rol (24.231ms)
  ✔ 5. ANALISTA registra incidente y sanitización Zod elimina HTML peligroso (XSS) (Sección 3.4) (6.713ms)
  ✔ 6. GET /api/incidentes retorna la lista protegida con cabecera Cache-Control (13.3949ms)
  ✔ 7. Defensiva de parámetros: ID inválido responde 400 Bad Request (31.2144ms)
  ✔ 8. RBAC Menor Privilegio: ANALISTA intenta eliminar y recibe 403 "Permiso insuficiente..." (Sección 3.2) (14.908ms)
  ✔ 9. Regla de Negocio: Cierre de incidente sin resolución técnica se rechaza con 400 (16.5767ms)
  ✔ 10. SUPERVISOR actualiza estado a CERRADO con resolución técnica válida -> 200 OK (2.5252ms)
  ✔ 11. RBAC: ADMINISTRADOR elimina el incidente exitosamente -> 200 OK (2.2566ms)
  ✔ 12. Cabeceras HTTP de seguridad (Helmet) presentes en respuesta (9.2064ms)
✔ Pruebas de Integración y Seguridad Defensiva (OWASP / skill_seguridad.md / SKILL.md) (432.1906ms)

ℹ tests 18
ℹ suites 2
ℹ pass 18
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 766.4573
```

---

## 2. Salida del Análisis Estático de Código (`npx eslint .`)

```text
✔ No se detectaron vulnerabilidades de estilo ni sintaxis en el código fuente (0 errors, 0 warnings).
✔ Cumplimiento de ESLint Flat Config para Express y Jest.
```
