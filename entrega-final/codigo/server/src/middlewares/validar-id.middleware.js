/**
 * Middleware para validar que el parámetro :id de la ruta sea un entero estrictamente positivo.
 */
function validarIdIncidente(req, res, next) {
  const { id } = req.params;
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    const error = new Error('El identificador del incidente debe ser un número entero positivo');
    error.statusCode = 400;
    error.code = 'INVALID_ID';
    return next(error);
  }

  req.params.id = parsedId;
  next();
}

module.exports = { validarIdIncidente };

