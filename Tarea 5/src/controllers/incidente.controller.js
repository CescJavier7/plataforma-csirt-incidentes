const incidenteService = require('../services/incidente.service');

/**
 * Controlador para las operaciones HTTP relacionadas con incidentes.
 */
class IncidenteController {
  /**
   * Crea un nuevo incidente.
   * POST /api/incidentes
   */
  async crear(req, res, next) {
    try {
      const nuevoIncidente = await incidenteService.crearIncidente(req.body);
      return res.status(201).json({
        success: true,
        message: 'Incidente creado exitosamente',
        data: nuevoIncidente,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene la lista de incidentes, con filtrado opcional por estado y prioridad.
   * GET /api/incidentes?estado=ABIERTO&prioridad=ALTA
   */
  async listar(req, res, next) {
    try {
      const { estado, prioridad } = req.validatedQuery;
      const incidentes = await incidenteService.listarIncidentes({ estado, prioridad });
      return res.status(200).json({
        success: true,
        total: incidentes.length,
        data: incidentes,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtiene un incidente específico por su ID.
   * GET /api/incidentes/:id
   */
  async obtenerPorId(req, res, next) {
    try {
      const { id } = req.params;
      const incidente = await incidenteService.obtenerIncidentePorId(id);
      return res.status(200).json({
        success: true,
        data: incidente,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Actualiza los datos o estado de un incidente.
   * PUT /api/incidentes/:id
   */
  async actualizar(req, res, next) {
    try {
      const { id } = req.params;
      const incidenteActualizado = await incidenteService.actualizarIncidente(id, req.body);
      return res.status(200).json({
        success: true,
        message: 'Incidente actualizado exitosamente',
        data: incidenteActualizado,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Elimina un incidente por su ID.
   * DELETE /api/incidentes/:id
   */
  async eliminar(req, res, next) {
    try {
      const { id } = req.params;
      await incidenteService.eliminarIncidente(id);
      return res.status(200).json({
        success: true,
        message: 'Incidente eliminado exitosamente',
        data: { id: Number(id) },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new IncidenteController();
