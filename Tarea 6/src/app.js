const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const env = require('./config/env');
const authRoutes = require('./routes/auth.routes');
const incidenteRoutes = require('./routes/incidente.routes');
const { sanitizarBody } = require('./middlewares/sanitize.middleware');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// No revelar la tecnología del servidor
app.disable('x-powered-by');

// Detrás de un proxy inverso con TLS (Nginx, balanceador) en producción
if (env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// 1) Cabeceras HTTP seguras (CSP, X-Content-Type-Options, X-Frame-Options, HSTS, etc.)
app.use(helmet());

// 2) CORS restringido: solo el/los origen(es) del cliente configurados en CLIENT_ORIGIN
app.use(
  cors({
    origin(origin, callback) {
      // Peticiones sin Origin (curl, Postman, server-to-server) no son de navegador: se permiten.
      if (!origin || env.CLIENT_ORIGINS.includes(origin)) return callback(null, true);
      const error = new Error(`Origen no permitido por CORS: ${origin}`);
      error.statusCode = 403;
      error.code = 'CORS_NOT_ALLOWED';
      return callback(error);
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    maxAge: 600,
  })
);

// 3) Limitación global de peticiones por IP
app.use(
  '/api',
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { success: false, message: 'Demasiadas peticiones', error: 'TOO_MANY_REQUESTS' },
  })
);

// 4) Parseo de JSON con límite de tamaño (mitiga payloads abusivos)
app.use(express.json({ limit: '10kb' }));

// 5) Limpieza de entradas: elimina cualquier etiqueta HTML de los strings del body
app.use(sanitizarBody);

// Ruta base para comprobación de estado de la API (pública)
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Montaje de rutas
app.use('/api/auth', authRoutes);
app.use('/api/incidentes', incidenteRoutes);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.path}`,
    error: 'ENDPOINT_NOT_FOUND',
  });
});

// Middleware centralizado de manejo de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
