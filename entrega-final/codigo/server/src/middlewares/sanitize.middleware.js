const sanitizeHtml = require('sanitize-html');

const opcionesSanitizado = {
  allowedTags: [],
  allowedAttributes: {},
};

function sanitizarValor(valor) {
  if (typeof valor === 'string') {
    return sanitizeHtml(valor, opcionesSanitizado).trim();
  }
  if (Array.isArray(valor)) {
    return valor.map(sanitizarValor);
  }
  if (valor !== null && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor).map(([k, v]) => [k, sanitizarValor(v)])
    );
  }
  return valor;
}

function sanitizarBody(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizarValor(req.body);
  }
  next();
}

module.exports = { sanitizarBody };

