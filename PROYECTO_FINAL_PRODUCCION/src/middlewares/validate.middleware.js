const validar = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.body);

  if (!resultado.success) {
    return res.status(400).json({
      error: 'Datos de entrada inválidos',
      detalles: resultado.error.flatten().fieldErrors,
    });
  }

  // Reemplaza el cuerpo por la información validada, tipada y sanitizada
  req.body = resultado.data;
  next();
};

const validarQuery = (schema) => (req, res, next) => {
  const resultado = schema.safeParse(req.query);

  if (!resultado.success) {
    return res.status(400).json({
      error: 'Parámetros de consulta inválidos',
      detalles: resultado.error.flatten().fieldErrors,
    });
  }

  req.validatedQuery = resultado.data;
  next();
};

module.exports = {
  validar,
  validarQuery,
  validateBody: validar,
  validateQuery: validarQuery,
};
