/* ==========================================================================
   MIDDLEWARE DE REGISTRO / AUDITORÍA (src/middleware/logger.js)
   Unidad 4: Node.js, Express, CRUD y Arquitectura Defensiva SOC
   Responsabilidad: Trazabilidad HTTP de accesos, cálculo de latencia en ms,
   registro de IPs y detección de anomalías sin fuga de datos sensibles.
   ========================================================================== */
'use strict';

function loggerMiddleware(req, res, next) {
  const tiempoInicio = process.hrtime.bigint();
  const timestamp = new Date().toISOString();
  const ipCliente = req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress || '127.0.0.1';

  // Al finalizar el ciclo de respuesta HTTP, calcular duración y registrar
  res.on('finish', () => {
    const tiempoFin = process.hrtime.bigint();
    const duracionMs = (Number(tiempoFin - tiempoInicio) / 1e6).toFixed(2);
    const codigoEstado = res.statusCode;

    // Etiqueta semántica de estado según código HTTP
    let etiqueta = '[INFO]';
    if (codigoEstado >= 500) etiqueta = '[CRIT]';
    else if (codigoEstado >= 400) etiqueta = '[WARN]';

    // Evitar ruido en modo test si estuviera activo
    if (process.env.NODE_ENV !== 'test-silent') {
      console.log(
        `${etiqueta} [${timestamp}] ${ipCliente} "${req.method} ${req.originalUrl || req.url}" ${codigoEstado} ${duracionMs}ms`
      );
    }
  });

  next();
}

module.exports = loggerMiddleware;
