const incidenteService = require('../services');

class IncidenteController {
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

  async listar(req, res, next) {
    try {
      // Optimización de rendimiento (Unidad 7): Caché controlada de 60s
      res.set('Cache-Control', 'public, max-age=60');

      const filtros = req.validatedQuery || {};
      const incidentes = await incidenteService.listarIncidentes(filtros);

      return res.status(200).json({
        success: true,
        total: incidentes.length,
        data: incidentes,
      });
    } catch (error) {
      next(error);
    }
  }

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

