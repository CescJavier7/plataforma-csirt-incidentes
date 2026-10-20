# 🏛️ Documento de Arquitectura y Decisiones de Diseño

## 1. Diagrama de Arquitectura en N-Capas

La plataforma sigue una arquitectura en capas desacopladas con separación estricta de responsabilidades:

```
[ Cliente Web SPA (HTML5/CSS3/ES6 Modules) ]
                    │
                    ▼  (HTTPS / TLS)
[ Proxy Inverso Nginx / Balanceador de Carga ] (Compresión Gzip + Caché 86400s)
                    │
                    ▼  (Proxy Pass /api)
[ Capa de Perímetro Express.js ]
   ├── Helmet (Cabeceras CSP, HSTS, X-Frame-Options, X-Content-Type)
   ├── CORS Restringido (CLIENT_ORIGIN estricto)
   ├── Rate Limiting Diferenciado (General: 100/min | Auth: 10/15min)
   └── JSON Body Parser (Limitación de Carga 20kb contra DoS)
                    │
                    ▼
[ Capa de Seguridad y Middlewares ]
   ├── autenticar (JWT Bearer con verificación forzada HS256)
   ├── permitir (RBAC: Analista, Supervisor, Administrador)
   ├── validar (Zod schema con sanitización XSS vía sanitize-html)
   └── validarIdIncidente (Defensa en profundidad para parámetros :id)
                    │
                    ▼
[ Capa de Controladores (MVC) ]
   ├── AuthController (Login, emisión de JWT y enmascaramiento de errores)
   └── IncidenteController (Orquestación HTTP y cabeceras Cache-Control)
                    │
                    ▼
[ Capa de Servicios y Reglas de Negocio ]
   ├── AuthService (Hash Bcrypt costo 12, prevención de timing attacks)
   ├── IncidenteService (Máquina de estados ITIL y exigencia de resolución)
   └── puedeCambiarEstado (Transición de estados y prohibición de reapertura)
                    │
                    ▼
[ Capa de Persistencia y ORM ]
   ├── Prisma Client (Consultas parametrizadas anti SQL Injection)
   └── MySQL 8.4 LTS (Motor InnoDB con codificación UTF8MB4)
```

---

## 2. Decisiones Técnicas y Patrones de Seguridad

1. **Cero Confianza en el Cliente (Zero-Trust Frontend)**:
   - La interfaz de usuario muestra u oculta botones según el rol del usuario únicamente para ergonomía. Toda autorización real se verifica en el servidor con el middleware `permitir()`.
2. **Defensa contra Ataques Criptográficos (A04)**:
   - Se fuerza el algoritmo `HS256` explícito en `jwt.verify()` para neutralizar ataques de confusión de algoritmo (`alg: none` o sustitución de clave pública/privada).
   - Se emplea `bcrypt` con costo 12 en contraseñas de usuarios.
3. **Validación y Sanitización Integrada (A05)**:
   - Los esquemas Zod aplican `.transform(sanitizarTexto)` que invoca a `sanitize-html` eliminando cualquier etiqueta antes de que el objeto llegue a la lógica de negocio o a Prisma.
4. **Resiliencia y Monitoreo (A09 / A10)**:
   - El middleware `errorHandler` captura excepciones globales, registra la traza en la consola del servidor con timestamp y envía respuestas genéricas 500 al cliente en producción.

