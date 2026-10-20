const { verificarToken } = require('../utils/token');

/**
 * Autenticación: exige un JWT válido en "Authorization: Bearer <token>".
 * Si es válido, deja disponible req.usuario = { id, email, rol }.
 * Responde 401 si el token falta, es inválido o expiró.
 */
const autenticar = (req, res, next) => {
  const header = req.headers.authorization || '';
  const [esquema, token] = header.split(' ');

  if (esquema !== 'Bearer' || !token) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido',
      error: 'UNAUTHORIZED',
    });
  }

  try {
    const payload = verificarToken(token);
    req.usuario = { id: Number(payload.sub), email: payload.email, rol: payload.rol };
    return next();
  } catch (error) {
    const expirado = error.name === 'TokenExpiredError';
    return res.status(401).json({
      success: false,
      message: expirado ? 'El token ha expirado' : 'Token inválido',
      error: expirado ? 'TOKEN_EXPIRED' : 'INVALID_TOKEN',
    });
  }
};

/**
 * Autorización por roles. Debe usarse DESPUÉS de autenticar.
 * Responde 403 si el rol del usuario no está en la lista permitida.
 * @param  {...string} rolesPermitidos ej. permitir('ANALISTA', 'ADMIN')
 */
const permitir = (...rolesPermitidos) => (req, res, next) => {
  if (!req.usuario) {
    return res.status(401).json({
      success: false,
      message: 'Token de acceso requerido',
      error: 'UNAUTHORIZED',
    });
  }

  if (!rolesPermitidos.includes(req.usuario.rol)) {
    return res.status(403).json({
      success: false,
      message: `Acceso denegado: se requiere uno de los roles [${rolesPermitidos.join(', ')}]`,
      error: 'FORBIDDEN',
    });
  }

  return next();
};

module.exports = { autenticar, permitir };

