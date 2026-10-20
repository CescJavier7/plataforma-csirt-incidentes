# 🧠 Matriz de Lecciones Aprendidas y Mejoras Continuas

Durante las 8 fases del ciclo de desarrollo de la plataforma se identificaron desafíos técnicos y arquitectónicos clave:

| Fase / Hito | Desafío Inicial Encontrado | Riesgo Asociado | Solución Técnica Aplicada | Lección Aprendida |
| :--- | :--- | :--- | :--- | :--- |
| **Persistencia ORM** | Pruebas unitarias fallaban si MySQL no estaba encendido en el host de CI. | Falsos positivos en pipelines de integración continua. | Sonda TCP en el puerto 3306 con `t.skip()` no bloqueante. | Diseñar pruebas resilientes que detecten la disponibilidad del entorno antes de colapsar. |
| **Control de Acceso (RBAC)** | Dependencia de roles en el cliente; posibles bypasses manipulando peticiones HTTP. | Escalada de privilegios horizontal y vertical (OWASP A01). | Implementación de Cero Confianza con middleware `permitir()` en cada ruta del backend. | La interfaz es solo para UX; la seguridad inquebrantable reside exclusivamente en el servidor. |
| **Confusión de Algoritmos JWT** | Tokens firmados sin forzar algoritmo eran vulnerables a ataques `alg: none`. | Falsificación de identidades y suplantación de administradores. | Validación explícita de `algorithms: ['HS256']` en `jwt.verify()`. | Nunca delegar en la cabecera del token la elección del algoritmo de verificación. |
| **Inyección XSS y DoS** | Payloads con scripts HTML y cuerpos de solicitud excesivamente grandes. | Robo de cookies/tokens de sesión y saturación de RAM en Node.js. | Límite de carga útil a `20kb` y transformación Zod con `sanitize-html`. | Sanitizar y tipar de forma defensiva antes de que los datos alcancen los controladores. |
| **Optimización de Activos** | Imágenes de topología de red en PNG pesaban más de 350 KB, degradando el First Contentful Paint. | Alto consumo de ancho de banda y latencia en conexiones móviles. | Conversión a formato moderno WebP (reducción del 93.6% en bytes) y cabeceras `Cache-Control`. | El rendimiento web es un pilar fundamental de la disponibilidad operativa en seguridad. |
| **Ciclo de Vida de Incidentes** | Cierres de incidentes sin documentación técnica de contención. | Pérdida de trazabilidad forense y auditorías no conformes. | Máquina de estados ITIL con validación de al menos 5 caracteres en resolución. | Codificar las políticas operativas en el software para evitar omisiones humanas. |

