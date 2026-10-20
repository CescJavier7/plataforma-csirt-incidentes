const express = require('express');
const incidenteRoutes = require('./routes/incidente.routes');
const errorHandler = require('./middlewares/error.middleware');

const app = express();

// Middleware para parseo de JSON en cuerpos de petición
app.use(express.json());

// Ruta base para comprobación de estado de la API
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    timestamp: new Date().toISOString(),
  });
});

// Montaje de rutas de incidentes
app.use('/api/incidentes', incidenteRoutes);

// Manejo de rutas inexistentes (404)
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
    error: 'ENDPOINT_NOT_FOUND',
  });
});

// Middleware centralizado de manejo de errores (siempre al final)
app.use(errorHandler);

module.exports = app;
