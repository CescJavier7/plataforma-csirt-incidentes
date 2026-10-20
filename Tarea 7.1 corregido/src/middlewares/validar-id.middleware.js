/**
 * Middleware para saneamiento y validación defensiva del parámetro :id.
 * Desacopla la validación de parámetros de la lógica de negocio del controlador (Refactorización MVC).
 */
function validarIdIncidente(req, res, next) {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id) || id <= 0) {
    return res.status(400).json({
      error: "Parámetro inválido",
      detalle: "El identificador del incidente debe ser un número entero positivo"
    });
  }

  req.incidenteId = id;
  next();
}

module.exports = { validarIdIncidente };

