const jwt = require('jsonwebtoken');
const env = require('../config/env');

function generarToken(payload) {
  return jwt.sign(payload, env.jwtSecret, {
    algorithm: env.jwtAlgorithm,
    expiresIn: env.jwtExpiresIn,
  });
}

function verificarToken(token) {
  return jwt.verify(token, env.jwtSecret, {
    algorithms: [env.jwtAlgorithm],
  });
}

module.exports = {
  generarToken,
  verificarToken,
};
