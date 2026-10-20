const jwt = require('jsonwebtoken');
const env = require('../config/env');

const OPCIONES = {
  algorithm: 'HS256',
  issuer: 'api-incidentes',
};

/**
 * Firma un JWT con la información mínima necesaria del usuario (nunca la contraseña).
 * @param {{ id: number, email: string, rol: string }} usuario
 * @returns {string} token firmado
 */
const crearToken = (usuario) =>
  jwt.sign({ sub: String(usuario.id), email: usuario.email, rol: usuario.rol }, env.JWT_SECRET, {
    ...OPCIONES,
    expiresIn: env.JWT_EXPIRES_IN,
  });

/**
 * Verifica firma, algoritmo, emisor y expiración del token.
 * Lanza JsonWebTokenError / TokenExpiredError si no es válido.
 * @param {string} token
 * @returns {object} payload decodificado
 */
const verificarToken = (token) =>
  jwt.verify(token, env.JWT_SECRET, {
    algorithms: [OPCIONES.algorithm],
    issuer: OPCIONES.issuer,
  });

module.exports = { crearToken, verificarToken };

