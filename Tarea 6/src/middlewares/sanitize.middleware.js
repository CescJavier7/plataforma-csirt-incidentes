const sanitizeHtml = require('sanitize-html');

/**
 * Configuración estricta: no se permite NINGUNA etiqueta ni atributo HTML.
 * El contenido de <script>/<style> se descarta por completo.
 */
const OPCIONES = {
  allowedTags: [],
  allowedAttributes: {},
  disallowedTagsMode: 'discard',
};

// Las contraseñas no se modifican: nunca se renderizan y solo se comparan con bcrypt.
const CAMPOS_EXCLUIDOS = new Set(['password']);

/**
 * Limpia recursivamente todos los strings de un valor (objetos, arreglos, primitivos).
 * Solo se decodifican entidades inofensivas (&amp;, comillas) para no guardar "&amp;"
 * en lugar de "&". Los caracteres < y > permanecen codificados (&lt; &gt;) para que
 * nadie pueda "contrabandear" etiquetas escribiéndolas como entidades.
 */
const limpiar = (valor) => {
  if (typeof valor === 'string') {
    const sinHtml = sanitizeHtml(valor, OPCIONES);
    return sinHtml
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&amp;(?!lt;|gt;)/g, '&')
      .trim();
  }
  if (Array.isArray(valor)) return valor.map(limpiar);
  if (valor && typeof valor === 'object') {
    return Object.fromEntries(
      Object.entries(valor)
        // Evita contaminación de prototipo
        .filter(([clave]) => !['__proto__', 'constructor', 'prototype'].includes(clave))
        .map(([clave, v]) => [clave, CAMPOS_EXCLUIDOS.has(clave) ? v : limpiar(v)])
    );
  }
  return valor;
};

/**
 * Middleware: sanitiza req.body antes de que llegue a validación (Zod) y a la capa de datos.
 */
const sanitizarBody = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = limpiar(req.body);
  }
  next();
};

module.exports = { sanitizarBody, limpiar };
