# 🎬 Guion Estructurado para el Video de Defensa Técnica (Máximo 20 Minutos)

**Proyecto:** Plataforma Web para la Gestión de Incidentes de Ciberseguridad (CSIRT / SOC)  
**Objetivo del Video:** Demostrar de forma rigurosa y ordenada el funcionamiento de la plataforma en producción, la arquitectura implementada, las defensas de ciberseguridad activas (OWASP Top 10) y la ejecución de pruebas automatizadas.

---

## ⏱️ Cronograma y Estructura del Video (20 Minutos Máximo)

### 📌 Bloque 1: Introducción y Planteamiento del Problema (Minutos 00:00 - 02:30)
- **Presentación:** Identificación del estudiante y contexto de la Unidad 8 (Proyecto Final Integrador).
- **Problema de Negocio:** La necesidad crítica de los equipos CSIRT/SOC de contar con una plataforma centralizada para registrar, clasificar, investigar y mitigar incidentes de ciberseguridad bajo estándares internacionales (NIST SP 800-61 / ITIL).
- **Alcance de la Solución:** Demostración de que la plataforma no es una maqueta aislada, sino una solución empresarial completa con arquitectura en capas, persistencia en base de datos relacional (MySQL 8.4) y seguridad multicapa.

### 🏛️ Bloque 2: Arquitectura del Sistema y Pila Tecnológica (Minutos 02:30 - 06:00)
- **Recorrido por el Diagrama de Capas:**
  - Front-end SPA moderno en HTML5, CSS3, JavaScript modular (ES6 Modules) optimizado en modo oscuro.
  - Proxy inverso Nginx perimetral con compresión Gzip y cabeceras de caché.
  - Back-end en Node.js y Express estructurado bajo patrón MVC desacoplado (Rutas, Middlewares, Controladores, Servicios, Esquemas).
  - Capa de persistencia con Prisma ORM interactuando con MySQL 8.4 LTS.
- **Demostración de Cero Confianza (Zero-Trust):**
  - Explicar cómo el cliente visual adapta sus botones por ergonomía, pero el servidor es el único árbitro que valida y autoriza cada acción mediante `autenticar()` y `permitir()`.

### 🛡️ Bloque 3: Auditoría y Demostración en Vivo de Ciberseguridad (Minutos 06:00 - 11:30)
*Esta es la sección técnica de mayor peso; demostrar en pantalla los controles de `skill_seguridad.md`:*
1. **Control de Acceso Roto (A01 - RBAC):**
   - Iniciar sesión como `analista@incidentes.com` y mostrar que puede crear incidentes y consultarlos.
   - Mostrar que el botón "Eliminar" no está visible en su interfaz, y demostrar mediante una petición cURL / Postman que si el analista intenta forzar un `DELETE /api/incidentes/1`, el servidor responde `403 Forbidden` con `"Permiso insuficiente para realizar esta acción"`.
   - Iniciar sesión como `supervisor@incidentes.com` y demostrar que puede modificar estados.
   - Iniciar sesión como `admin@incidentes.com` y demostrar la eliminación exitosa con `200 OK`.
2. **Mitigación de Enumeración y Fallos de Autenticación (A07):**
   - Intentar login con contraseña incorrecta y con un correo inexistente. Mostrar que en ambos casos la respuesta es unívoca: `401 Unauthorized` con el mensaje `"Credenciales incorrectas"` (sin revelar si el correo existe).
3. **Inyección y Sanitización XSS (A05):**
   - Enviar un incidente con payload malicioso: `<script>alert("XSS")</script>` en el título.
   - Mostrar cómo el esquema Zod y `sanitize-html` neutralizan el script antes de almacenarlo en la base de datos.
4. **Reglas de Negocio del Ciclo de Vida (ITIL):**
   - Intentar cerrar un incidente sin resolución técnica. Mostrar el error `400 Bad Request`.
   - Ingresar una resolución técnica válida ($\ge 5$ caracteres) y mostrar el cierre exitoso.
   - Demostrar que un ticket `CERRADO` no permite reactivación arbitraria.

### 🧪 Bloque 4: Verificación de Pruebas Automatizadas y Rendimiento (Minutos 11:30 - 16:00)
- **Ejecución de Pruebas en Vivo:**
  - Abrir la terminal y ejecutar `npm test`.
  - Explicar cómo las 17 pruebas unitarias y de integración validan en menos de un segundo toda la matriz de seguridad y reglas de negocio.
- **Rendimiento y Optimización Web (Unidad 7):**
  - Mostrar en DevTools la entrega del diagrama de topología de red en formato `.webp` (reducción de más del 90% en bytes frente al PNG original).
  - Inspeccionar la cabecera `Cache-Control: public, max-age=60` en las respuestas de la API y de 1 día en recursos estáticos.

### 🚀 Bloque 5: Despliegue en Producción y Script de Humo (Minutos 16:00 - 18:30)
- **Demostración de Producción:**
  - Mostrar el contenedor Docker o la URL pública en producción con HTTPS activo.
  - Ejecutar el script automatizado de pruebas de humo:
    ```bash
    node scripts/verificar-entrega.js
    ```
  - Observar cómo verifica el `/health`, los bloqueos sin token, las credenciales inválidas y el flujo completo con JWT.

### 🏁 Bloque 6: Conclusiones y Retrospectiva (Minutos 18:30 - 20:00)
- **Lecciones Aprendidas:** Destacar el valor de la defensa en profundidad, el uso de esquemas Zod con sanitización integrada y la arquitectura de migraciones con Prisma.
- **Cierre formal:** Agradecimiento y fin de la defensa.

