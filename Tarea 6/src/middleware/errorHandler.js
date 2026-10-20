/* ==========================================================================
   MIDDLEWARE DE MANEJO DE ERRORES DEFENSIVO (src/middleware/errorHandler.js)
   Unidad 4: Node.js, Express, CRUD y Arquitectura Defensiva SOC
   Responsabilidad: Centralizar excepciones, capturar rutas inexistentes y
   evitar fuga de información (Zero Information Leakage / No Stack Traces).
   ========================================================================== */
'use strict';

/**
 * Middleware para rutas no encontradas (404) bajo el prefijo /api.
 */
function rutaNoEncontrada(req, res, next) {
  res.status(404).json({
    exito: false,
    error: `Ruta de API no encontrada: [${req.method}] ${req.originalUrl || req.url}`,
    codigo: 404
  });
}

/**
 * Middleware centralizado de gestión de errores (4 parámetros requeridos por Express).
 */
function manejadorErrores(err, req, res, next) {
  // Si las cabeceras ya fueron enviadas, delegar al manejador por defecto de Express
  if (res.headersSent) {
    return next(err);
  }

  // Manejo de error de parsing JSON en el cuerpo de la solicitud
  if (err instanceof SyntaxError && 'body' in err) {
    return res.status(400).json({
      exito: false,
      error: 'Formato JSON inválido en el cuerpo de la solicitud.',
      codigo: 400
    });
  }

  // Determinar código HTTP defensivo
  const codigo = Number(err.statusCode || err.status || 500);

  // Registro en log interno del servidor (para depuración del administrador)
  if (codigo >= 500) {
    console.error(`[ERROR CRÍTICO] ${err.name || 'Error'}: ${err.message}`);
  }

  // Mensaje higienizado para el cliente: no exponer nunca rutas de disco ni stack traces
  const mensajeCliente = codigo >= 500
    ? 'Ocurrió un error interno en el servidor. Por favor intente más tarde.'
    : (err.message || 'Error en la solicitud procesada.');

  res.status(codigo).json({
    exito: false,
    error: mensajeCliente,
    codigo
  });
}

module.exports = {
  rutaNoEncontrada,
  manejadorErrores
};
