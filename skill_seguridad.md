# SKILL: Desarrollador Especialista en Ciberseguridad y Configuraciones de Seguridad

## 🎯 Perfil y Propósito de la Skill

Esta skill define los principios técnicos, patrones arquitectónicos, reglas de codificación defensiva y configuraciones indispensables que debes aplicar como **Agente IA (Antigravity)** al generar, refactorizar o auditar software para plataformas web, APIs REST y bases de datos.

Todas las decisiones de diseño e implementación deben alinearse con la **Defensa en Profundidad**, el **Principio de Menor Privilegio (Least Privilege)** y la mitigación estricta del estándar **OWASP Top 10**.

---

## 🛡️ 1. Principios Innegociables de Seguridad

1. **Cero Confianza en el Cliente (Zero-Trust Frontend)**:
   - Toda entrada proveniente del cliente o de fuentes externas es potencialmente hostil.
   - La validación visual y las restricciones de interfaz de usuario son exclusivamente para experiencia de usuario (UX). **La autorización y validación real se ejecutan obligatoriamente en el servidor**.

2. **Principio de Menor Privilegio**:
   - Asignar estrictamente los permisos mínimos requeridos por cada rol e identidad para su operativa.
   - Separar de forma explícita la verificación de identidad (autenticación) del control de acceso a recursos (autorización).

3. **Protección de Secretos y Fallo Seguro**:
   - Nunca exponer credenciales, claves criptográficas, cadenas de conexión ni trazas técnicas (*stack traces*) en respuestas HTTP públicas ni en repositorios de código.
   - Diseñar la aplicación para fallar de manera segura y temprana (*fail-fast*): si las variables críticas no existen, el servicio no debe arrancar.

---

## 🚨 2. Mitigación Práctica de OWASP Top 10

### A01: Control de Acceso Roto (Broken Access Control)
- **Regla**: Validar identidad (JWT) y privilegios (RBAC) en cada endpoint protegido.
- **Implementación**:
  - Middleware `autenticar`: Extrae el token `Bearer`, verifica firma y vigencia forzando algoritmos permitidos y asocia el payload a `req.usuario` (responde `401 Unauthorized` si falla).
  - Middleware `permitir(...roles)`: Comprueba si `req.usuario.rol` está autorizado para ejecutar la operación solicitada (responde `403 Forbidden` si no tiene permisos).
- **Matriz RBAC Estándar**:
  - `Analista`: `GET` (consultar incidentes) y `POST` (registrar incidentes).
  - `Supervisor`: `GET`, `POST` y `PUT/PATCH` (actualizar estado y prioridad).
  - `Administrador`: Control total (`GET`, `POST`, `PUT/PATCH`, `DELETE`).

### A02: Configuración Incorrecta de Seguridad (Security Misconfiguration)
- **Cabeceras HTTP**: Configurar cabeceras de seguridad mediante `helmet()` (CSP, HSTS, `X-Frame-Options`, `X-Content-Type-Options` y remoción de `X-Powered-By`).
- **CORS Estricto**: Restringir el origen exclusivamente al dominio del cliente autorizado (`CLIENT_ORIGIN`), detallando verbos y cabeceras admitidas.
- **Payload Limiting**: Restringir la carga útil a `express.json({ limit: "20kb" })` para prevenir saturación de memoria y ataques DoS.
- **Control de Tasa Diferenciado**: Aplicar una política general para navegación y una política estricta para rutas críticas de login/registro.

### A04: Fallos Criptográficos (Cryptographic Failures)
- **Contraseñas**: Hashear con `bcrypt` (factor de costo $\ge 12$) o `Argon2id`. Prohibido el texto plano o algoritmos reversibles.
- **Comunicaciones**: Forzar HTTPS en producción y entornos de pruebas integradas.
- **Tokens**: Firmar tokens con secretos criptográficamente robustos cargados desde el entorno (`JWT_SECRET`) y especificar siempre el algoritmo explícito (`HS256` o `RS256`) tanto en firma como en verificación.

### A05: Inyección (SQL / NoSQL / Command)
- **Persistencia**: Usar ORMs/Query Builders (ej. Prisma ORM) con consultas parametrizadas. Prohibida la concatenación directa de cadenas en consultas o comandos del sistema operativo.
- **Validación y Sanitización**: Validar esquemas con Zod antes de que los datos alcancen la capa de negocio o persistencia. Sanitizar cadenas de texto descriptivo susceptible a HTML malicioso.

### A07: Fallos de Identificación y Autenticación
- **Prevención de Enumeración**: Responder siempre con `401 Unauthorized` y el mensaje genérico `"Credenciales incorrectas"` ante cualquier fallo de correo, usuario o contraseña.
- **Vigencia de Sesión**: Configurar tiempos de vida cortos para tokens de acceso (`expiresIn: "30m"` o `"1h"`).
- **Fuerza Bruta**: Aplicar limitadores de tasa agresivos (máximo 5 a 10 intentos cada 15 minutos por IP).

### A09: Fallos en el Registro y Monitoreo (Security Logging)
- **Trazabilidad**: Registrar fecha, hora, método HTTP, ruta, código de estado y tiempo de respuesta.
- **Sanitización de Logs**: Omitir o enmascarar tokens JWT, contraseñas, números de identificación o datos personales en cualquier salida de log.

### A10: Gestión Inadecuada de Excepciones
- **Middleware Centralizado**: Capturar cualquier error no controlado en un manejador global al final del ciclo de middlewares.
- **Fuga de Información**: Retornar únicamente respuestas genéricas `500 Internal Server Error` al cliente. Guardar el error técnico y la traza exclusivamente en los logs del servidor.

---

## ⚙️ 3. Código de Referencia e Implementación Técnica

### 3.1 Carga y Validación de Entorno (`src/config/env.js`)

```javascript
require("dotenv").config();

const variablesObligatorias = ["DATABASE_URL", "JWT_SECRET", "CLIENT_ORIGIN"];
const faltantes = variablesObligatorias.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  throw new Error(
    `[CRÍTICO] Faltan las siguientes variables de entorno: ${faltantes.join(", ")}`
  );
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  jwtAlgorithm: "HS256",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "30m",
  clientOrigin: process.env.CLIENT_ORIGIN,
  nodeEnv: process.env.NODE_ENV || "development"
};

## 3.2 Middlewares de Autenticación y Autorización (`src/middlewares/auth.middleware.js`)

```javascript
const jwt = require("jsonwebtoken");
const env = require("../config/env");

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const [tipo, token] = authHeader.split(" ");

  if (tipo !== "Bearer" || !token) {
    return res.status(401).json({ error: "Token de acceso requerido" });
  }

  try {
    // Se fuerza explícitamente el algoritmo para mitigar ataques de confusión (alg: none / switching)
    const payload = jwt.verify(token, env.jwtSecret, {
      algorithms: [env.jwtAlgorithm]
    });

    req.usuario = payload; // Contiene sub (ID de usuario) y rol
    next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
}

function permitir(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario || !rolesPermitidos.includes(req.usuario.rol)) {
      return res.status(403).json({
        error: "Permiso insuficiente para realizar esta acción"
      });
    }
    next();
  };
}

module.exports = { autenticar, permitir };
```

## 3.3 Middleware Declarativo de Validación (`src/middlewares/validate.middleware.js`)

```javascript
const validar = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: "Datos de entrada inválidos",
      detalles: resultado.error.flatten().fieldErrors
    });
  }

  // Reemplaza el cuerpo por la información validada, tipada y sanitizada
  req.body = resultado.data;
  next();
};

module.exports = { validar };
```

## 3.4 Esquemas de Datos con Zod y Sanitización (`src/schemas/incidente.schema.js`)

```javascript
const { z } = require("zod");
const sanitizeHtml = require("sanitize-html");

const sanitizarTexto = (valor) =>
  sanitizeHtml(valor, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();

const incidenteSchema = z.object({
  titulo: z
    .string()
    .trim()
    .min(5, "El título debe tener al menos 5 caracteres")
    .max(120, "El título no puede superar los 120 caracteres")
    .transform(sanitizarTexto),

  descripcion: z
    .string()
    .trim()
    .min(10, "La descripción requiere mínimo 10 caracteres")
    .max(2000, "La descripción no puede superar los 2000 caracteres")
    .transform(sanitizarTexto),

  prioridad: z.enum(["BAJA", "MEDIA", "ALTA", "CRITICA"], {
    errorMap: () => ({
      message: "Prioridad debe ser BAJA, MEDIA, ALTA o CRITICA"
    })
  }),

  estado: z.enum(["ABIERTO", "EN_PROCESO", "CERRADO"]).default("ABIERTO")
});

module.exports = { incidenteSchema };
```

## 3.5 Middleware de Manejo de Excepciones (`src/middlewares/error.middleware.js`)

```javascript
const env = require("../config/env");

function errorHandler(err, req, res, next) {
  // Registro técnico detallado en el servidor para auditoría
  console.error(
    `[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`,
    err
  );

  // Respuesta controlada hacia el cliente sin filtrar detalles internos
  res.status(500).json({
    error: "Ocurrió un error interno en el servidor",
    ...(env.nodeEnv === "development" && { trazaTecnica: err.message })
  });
}

module.exports = errorHandler;
```

## 3.6 Ensamblado Principal del Servidor Express (`src/app.js`)

```javascript
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const env = require("./config/env");
const errorHandler = require("./middlewares/error.middleware");

const app = express();

// 1. Cabeceras HTTP seguras
app.use(helmet());

// 2. CORS restringido a origen autorizado
app.use(
  cors({
    origin: env.clientOrigin,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  })
);

// 3. Limitación de tamaño de payload contra DoS
app.use(express.json({ limit: "20kb" }));

// 4. Rate Limiter general para la API (100 peticiones por minuto por IP)
const limitadorGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: {
    error: "Demasiadas peticiones. Intente nuevamente en un minuto."
  }
});
app.use(limitadorGeneral);

// 5. Rate Limiter estricto para autenticación (previene ataques de fuerza bruta)
const limitadorAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: "Demasiados intentos de autenticación. Bloqueado temporalmente."
  }
});

// 6. Endpoint de verificación de estado (Health Check)
app.get("/health", (req, res) => {
  res.status(200).json({
    estado: "ok",
    timestamp: new Date().toISOString()
  });
});

// 7. Rutas del sistema
app.use("/api/auth", limitadorAutenticacion, require("./routes/auth.routes"));
app.use("/api/incidentes", require("./routes/incidente.routes"));

// 8. Manejo de rutas inexistentes (404) y excepciones globales (500)
app.use((req, res) => res.status(404).json({ error: "Recurso no encontrado" }));
app.use(errorHandler);

module.exports = app;
```