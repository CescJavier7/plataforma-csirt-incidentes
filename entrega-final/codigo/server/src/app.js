const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const prisma = require('./config/prisma');
const { auditMiddleware } = require('./middlewares/audit.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// No revelar la tecnología del backend
app.disable('x-powered-by');

// En producción detrás de proxy inverso: confianza en cabeceras y redirección obligatoria a HTTPS (Recomendación 6)
if (env.nodeEnv === 'production') {
  app.set('trust proxy', 1);
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// 1. Cabeceras HTTP seguras mediante Helmet (HSTS, CSP, X-Frame-Options, X-Content-Type)
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'blob:'],
        connectSrc: ["'self'", ...(env.clientOrigins.length ? env.clientOrigins : [env.clientOrigin])],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    crossOriginEmbedderPolicy: false,
  })
);

// 2. CORS restringido a origen autorizado (con normalización de barras y soporte multiorigen)
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalizedOrigin = origin.replace(/\/+$/, '').toLowerCase();
      const permitidos = (env.clientOrigins.length ? env.clientOrigins : [env.clientOrigin])
        .map((o) => (o || '').trim().replace(/\/+$/, '').toLowerCase())
        .filter(Boolean);

      if (permitidos.includes(normalizedOrigin)) return callback(null, true);
      const err = new Error(`Origen no permitido por CORS: ${origin}`);
      err.statusCode = 403;
      err.code = 'CORS_NOT_ALLOWED';
      return callback(err);
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Correlation-ID'],
    exposedHeaders: ['X-Correlation-ID'],
    credentials: true,
  })
);

// 3. Limitación de tamaño de payload contra DoS (máx 20kb)
app.use(express.json({ limit: '20kb' }));

// 4. Rate Limiter general para la API (100 peticiones por minuto por IP)
const limitadorGeneral = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiadas peticiones. Intente nuevamente en un minuto.',
  },
});
app.use('/api', limitadorGeneral);

// 5. Rate Limiter estricto para autenticación (previene ataques de fuerza bruta)
const limitadorAutenticacion = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 10, // Máximo 10 intentos
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Demasiados intentos de autenticación. Bloqueado temporalmente.',
  },
});

// 6. Auditoría y Trazabilidad de Seguridad (OWASP A09 / SKILL.md Fase 2.3)
app.use(auditMiddleware);

// 7. Servir estáticos del cliente (SPA) con cabeceras de caché optimizadas
app.use(
  express.static(path.join(__dirname, '../../client'), {
    maxAge: '1d',
    setHeaders(res, filePath) {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else {
        res.setHeader('Cache-Control', 'public, max-age=86400, immutable');
      }
    },
  })
);

// 8. Endpoint de verificación de estado (Health Check - SKILL.md Fase 2.1)
const healthHandler = (req, res) => {
  res.status(200).json({
    status: 'UP',
    estado: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: env.nodeEnv,
    services: {
      api: 'healthy',
    },
    uptime: Number(process.uptime().toFixed(2)),
    persistence: env.persistence,
  });
};
app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// 8.1 Endpoint de disponibilidad con base de datos (Readiness Check - SKILL.md Fase 2.2)
const readyHandler = async (req, res) => {
  try {
    if (prisma) {
      await prisma.$queryRawUnsafe('SELECT 1');
    }
    return res.status(200).json({
      status: 'READY',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: 'connected',
      },
      uptime: Number(process.uptime().toFixed(2)),
      persistence: env.persistence,
    });
  } catch (err) {
    console.error('[DATABASE_READINESS_ERROR] Error en verificación de base de datos:', err.message);
    return res.status(503).json({
      status: 'UNAVAILABLE',
      timestamp: new Date().toISOString(),
      services: {
        api: 'healthy',
        database: 'disconnected',
      },
      uptime: Number(process.uptime().toFixed(2)),
      persistence: env.persistence,
    });
  }
};
app.get('/ready', readyHandler);
app.get('/api/ready', readyHandler);

// 9. Rutas del sistema
app.use('/api/auth', limitadorAutenticacion, require('./routes/auth.routes'));
app.use('/api/incidentes', require('./routes/incidente.routes'));

// 10. Manejo de endpoints de API inexistentes (404)
app.use('/api/*', (req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));

// 11. Fallback para enrutamiento SPA
app.get('*', (req, res, next) => {
  if (req.accepts('html')) {
    return res.sendFile(path.join(__dirname, '../../client/index.html'));
  }
  next();
});

// 12. Manejo de rutas inexistentes (404) y excepciones globales (500)
app.use((req, res) => res.status(404).json({ error: 'Recurso no encontrado' }));
app.use(errorHandler);

module.exports = app;
