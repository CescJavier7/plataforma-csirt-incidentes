/**
 * Middleware y Utilidad de Auditoría y Trazabilidad de Seguridad (OWASP A09)
 * Registra cada acción relevante con IP, acción, usuario autenticado, método y timestamp.
 */

function obtenerIpCliente(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || '127.0.0.1';
}

function registrarLogSeguridad({ ip, accion, usuario, metodo, ruta, estado, detalles }) {
  const timestamp = new Date().toISOString();
  const identUsuario = usuario
    ? `${usuario.email || usuario.nombre || 'ID:' + usuario.id} [${usuario.rol || 'USER'}]`
    : 'ANONYMOUS';

  const logLine = `[AUDIT_LOG] ${timestamp} | IP: ${ip} | USER: ${identUsuario} | ACTION: ${accion} | ${metodo || ''} ${ruta || ''} | STATUS: ${estado || 200}${detalles ? ' | ' + detalles : ''}`;

  console.log(logLine);
}

function auditMiddleware(req, res, next) {
  const ip = obtenerIpCliente(req);

  res.on('finish', () => {
    if (req.originalUrl.startsWith('/api')) {
      const usuario = req.usuario || null;
      let accion = `${req.method}_${req.baseUrl || req.path}`;

      if (req.originalUrl.includes('/api/auth/login')) {
        accion = res.statusCode === 200 ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED';
      } else if (req.originalUrl.startsWith('/api/incidentes')) {
        switch (req.method) {
          case 'GET':
            accion = req.params.id ? 'READ_INCIDENT_DETAIL' : 'LIST_INCIDENTS';
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

