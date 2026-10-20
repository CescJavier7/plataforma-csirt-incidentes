/**
 * Middleware para validar el cuerpo de la petición (req.body) contra un esquema Zod.
 * @param {import('zod').ZodSchema} schema 
 * @param {'body' | 'query'} [source='body']
 */
const validate = (schema, source = 'body') => {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const errors = result.error.errors.map((err) => ({
        campo: err.path.join('.') || 'body',
        mensaje: err.message,
      }));

      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors,
      });
    }

    if (source === 'query') {
      req.validatedQuery = result.data;
    } else {
      req.body = result.data;
    }
    next();
  };
};

module.exports = validate;
