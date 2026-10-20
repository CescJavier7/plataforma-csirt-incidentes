/**
 * Middleware centralizado para el manejo de excepciones y errores.
 * Actúa como barrera defensiva evitando fugas de información interna (stack traces, SQL, rutas).
 */
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, req, res, next) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ERROR] [${new Date().toISOString()}] ${req.method} ${req.url}:`, err);
  }

  // Error de sintaxis JSON en el cuerpo de la petición
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      message: 'Sintaxis JSON inválida en el cuerpo de la petición',
      error: 'BAD_REQUEST',
    });
  }

  // Error de validación Zod capturado manualmente o lanzado en capa de servicio
  if (err.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      message: 'Datos de entrada inválidos',
      errors: err.errors.map((e) => ({
        campo: e.path.join('.') || 'body',
        mensaje: e.message,
      })),
    });
  }

  // Errores de JWT que pudieran propagarse fuera del middleware de autenticación
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      message: 'Token inválido o expirado',
      error: 'INVALID_TOKEN',
    });
  }

  // Cuerpo de la petición mayor al límite permitido (express.json({ limit }))
  if (err.type === 'entity.too.large') {
    return res.status(413).json({
      success: false,
      message: 'El cuerpo de la petición excede el tamaño permitido',
      error: 'PAYLOAD_TOO_LARGE',
    });
  }

  // Errores de Prisma ORM
  if (err.code) {
    // P2025: Registro no encontrado en operación de actualización o eliminación
    if (err.code === 'P2025') {
      return res.status(404).json({
        success: false,
        message: 'Recurso no encontrado',
        error: 'INCIDENTE_NO_ENCONTRADO',
      });
    }

    // P2002: Violación de restricción única
    if (err.code === 'P2002') {
      return res.status(409).json({
        success: false,
        message: 'Conflicto: ya existe un registro con ese valor único',
        error: 'CONFLICT',
      });
    }
  }

  // Base de datos no disponible (sin exponer cadena de conexión ni detalles)
  if (err.name === 'PrismaClientInitializationError' || err.code === 'P1001') {
    return res.status(503).json({
      success: false,
      message: 'Servicio de datos no disponible temporalmente',
      error: 'SERVICE_UNAVAILABLE',
    });
  }

  // Errores operacionales personalizados con código HTTP asignado
  if (err.statusCode && err.statusCode !== 500) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message || 'Error en la solicitud',
      error: err.code || 'OPERATIONAL_ERROR',
    });
  }

  // Error 500 controlado sin exponer trazas de pila ni información interna de BD
  return res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
  });
};

module.exports = errorHandler;
