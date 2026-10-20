const jwt = require('jsonwebtoken');
const env = require('../config/env');

function autenticar(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [tipo, token] = authHeader.split(' ');

  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  try {
    // Se fuerza explícitamente el algoritmo para mitigar ataques de confusión (alg: none / switching)
    const payload = jwt.verify(token, env.jwtSecret, {
      algorithms: [env.jwtAlgorithm],
    });

    req.usuario = payload; // Contiene sub/id y rol
    next();
  } catch (error) { // eslint-disable-line no-unused-vars
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

function permitir(...rolesPermitidos) {
  return (req, res, next) => {
    if (!req.usuario) {
      return res.status(401).json({ error: 'Token de acceso requerido' });
    }

    // Normalización de roles para admitir variantes ("ANALISTA" o "Analista", "ADMIN" o "Administrador")
    const normalizar = (r) =>
      String(r)
        .trim()
        .toUpperCase()
        .replace('ADMINISTRADOR', 'ADMIN');

    const rolesNormalizados = rolesPermitidos.map(normalizar);
    const rolActual = normalizar(req.usuario.rol || '');

    if (!rolesNormalizados.includes(rolActual)) {
      return res.status(403).json({
        error: 'Permiso insuficiente para realizar esta acción',
      });
    }

    next();
  };
}

module.exports = {
  autenticar,
  permitir,
  autorizar: permitir,
};
