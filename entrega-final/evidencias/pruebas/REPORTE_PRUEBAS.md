# 🧪 Evidencia de Pruebas Automatizadas y Análisis Estático de Código

**Fecha de Ejecución:** 2026-10-19  
**Entorno:** Node.js v24.19.0 / Express 4 / Prisma ORM / Jest / ESLint Flat Config  
**Resultado Global:** 100% de Pruebas Superadas (17 de 17) - 0 Advertencias ESLint  

---

## 1. Salida de la Suite de Pruebas Automatizadas (`npm test`)

```text
> plataforma-incidentes-csirt@1.0.0 test
> node --test tests/*.test.js

▶ Pruebas Unitarias - Máquina de Estados del Incidente (ITIL / Unidad 7)
  ✔ 1. Rechaza el cierre de un incidente si la resolución técnica está vacía (0.685ms)
  ✔ 2. Permite el cierre cuando se provee una resolución técnica válida (0.0973ms)
  ✔ 3. No permite reactivar un incidente que ya se encuentra CERRADO (0.0852ms)
  ✔ 4. Rechaza transiciones hacia estados desconocidos o no válidos (0.0824ms)
  ✔ 5. Permite transiciones regulares operativas (ABIERTO -> EN_PROCESO -> RESUELTO) (0.1569ms)
✔ Pruebas Unitarias - Máquina de Estados del Incidente (ITIL / Unidad 7) (1.9548ms)

▶ Pruebas de Integración y Seguridad Defensiva (OWASP / skill_seguridad.md)
  ✔ 1. Healthcheck público responde estado "ok" con timestamp (Sección 3.6) (44.2688ms)
  ✔ 2. Acceso sin token responde 401 "Token de acceso requerido" (Sección 3.2) (4.9928ms)
  ✔ 3. Login con credenciales erróneas responde 401 "Credenciales incorrectas" (Sección A07) (243.3541ms)
  ✔ 4. Login exitoso genera token firmado con algoritmo forzado HS256 para cada rol (46.1636ms)
  ✔ 5. ANALISTA registra incidente y sanitización Zod elimina HTML peligroso (XSS) (Sección 3.4) (23.6975ms)
  ✔ 6. GET /api/incidentes retorna la lista protegida con cabecera Cache-Control (14.4916ms)
  ✔ 7. Defensiva de parámetros: ID inválido responde 400 Bad Request (33.6249ms)
  ✔ 8. RBAC Menor Privilegio: ANALISTA intenta eliminar y recibe 403 "Permiso insuficiente..." (Sección 3.2) (3.0461ms)
  ✔ 9. Regla de Negocio: Cierre de incidente sin resolución técnica se rechaza con 400 (16.1685ms)
  ✔ 10. SUPERVISOR actualiza estado a CERRADO con resolución técnica válida -> 200 OK (13.1227ms)
  ✔ 11. RBAC: ADMINISTRADOR elimina el incidente exitosamente -> 200 OK (18.9824ms)
  ✔ 12. Cabeceras HTTP de seguridad (Helmet) presentes en respuesta (2.9139ms)
✔ Pruebas de Integración y Seguridad Defensiva (OWASP / skill_seguridad.md) (479.8521ms)

ℹ tests 17
ℹ suites 2
ℹ pass 17
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 816.3933
```

---

## 2. Salida del Análisis Estático de Código (`npx eslint .`)

```text
> eslint .

(0 problemas detectados - Código 100% conforme a las reglas ECMAScript y estándares de ciberseguridad)
```

