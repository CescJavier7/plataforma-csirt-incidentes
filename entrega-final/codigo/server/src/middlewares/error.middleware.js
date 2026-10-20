const env = require('../config/env');

function errorHandler(err, req, res, next) { // eslint-disable-line no-unused-vars
  // Registro técnico detallado en el servidor para auditoría (A09 / A10)
  console.error(
    `[ERROR] ${new Date().toISOString()} - ${req.method} ${req.originalUrl}:`,
    err
  );

  const statusCode =
    err.statusCode || (err.status && err.status >= 400 && err.status < 600 ? err.status : 500);

  if (statusCode >= 400 && statusCode < 500) {
    return res.status(statusCode).json({
      error: err.message,
      ...(err.code && { codigo: err.code }),
      ...(err.detalles && { detalles: err.detalles }),
    });
  }

  // Respuesta controlada hacia el cliente sin filtrar detalles internos (500)
  res.status(500).json({
    error: 'Ocurrió un error interno en el servidor',
    ...((env.nodeEnv === 'development' || env.NODE_ENV === 'development') && {
      trazaTecnica: err.message,
    }),
  });
}

module.exports = errorHandler;
