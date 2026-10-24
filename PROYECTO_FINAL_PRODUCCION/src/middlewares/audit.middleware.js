/**
 * Middleware y Utilidad de Auditoría y Trazabilidad de Seguridad (OWASP A09 / SKILL.md Fase 2.3)
 * Registra cada acción relevante con timestamp, correlationId, IP, usuario, acción, método, status y responseTimeMs.
 */
const crypto = require('crypto');

function obtenerIpCliente(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

function registrarLogSeguridad({ ip, accion, usuario, metodo, ruta, estado, correlationId, responseTimeMs, detalles }) {
  const timestamp = new Date().toISOString();
  const identUsuario = usuario
    ? `${usuario.email || usuario.nombre || 'ID:' + usuario.id} [${usuario.rol || 'USER'}]`
    : 'ANONYMOUS';

  const cid = correlationId || 'N/A';
  const duration = responseTimeMs !== undefined ? `${responseTimeMs}ms` : '0ms';
  const logLine = `[AUDIT_LOG] ${timestamp} | CORRELATION_ID: ${cid} | IP: ${ip} | USER: ${identUsuario} | ACTION: ${accion} | ${metodo || ''} ${ruta || ''} | STATUS: ${estado || 200} | DURATION: ${duration}${detalles ? ' | ' + detalles : ''}`;

  console.log(logLine);
}

function auditMiddleware(req, res, next) {
  const ip = obtenerIpCliente(req);
  const startTime = process.hrtime.bigint();
  const correlationId = req.headers['x-correlation-id'] || req.headers['x-request-id'] || crypto.randomUUID();
  req.correlationId = correlationId;
  res.setHeader('X-Correlation-ID', correlationId);

  // Interceptar la finalización de la respuesta para auditar el código de estado
  res.on('finish', () => {
    // Solo auditar rutas de API relevantes
    if (req.originalUrl.startsWith('/api')) {
      const endTime = process.hrtime.bigint();
      const responseTimeMs = Number((endTime - startTime) / 1000000n);
      const usuario = req.usuario || null;
      let accion = `${req.method}_${req.baseUrl || req.path}`;

      if (req.originalUrl.includes('/api/auth/login')) {
        accion = res.statusCode === 200 ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
      } else if (req.originalUrl.startsWith('/api/incidentes')) {
        switch (req.method) {
          case 'GET':
            accion = req.params?.id ? 'READ_INCIDENT_DETAIL' : 'LIST_INCIDENTS';
            break;
          case 'POST':
            accion = 'CREATE_INCIDENT';
            break;
          case 'PUT':
          case 'PATCH':
            accion = 'UPDATE_INCIDENT_STATE';
            break;
          case 'DELETE':
            accion = 'DELETE_INCIDENT';
            break;
        }
      }

      // Si el acceso fue bloqueado
      if (res.statusCode === 401) {
        accion = accion.includes('LOGIN') ? accion : 'UNAUTHORIZED_ACCESS_ATTEMPT';
      } else if (res.statusCode === 403) {
        accion = 'FORBIDDEN_PRIVILEGE_VIOLATION';
      }

      registrarLogSeguridad({
        ip,
        accion,
        usuario,
        metodo: req.method,
        ruta: req.originalUrl,
        estado: res.statusCode,
        correlationId,
        responseTimeMs,
      });
    }
  });

  next();
}

module.exports = {
  auditMiddleware,
  registrarLogSeguridad,
  obtenerIpCliente,
};
