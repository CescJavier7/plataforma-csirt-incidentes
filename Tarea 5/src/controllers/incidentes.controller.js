/* ==========================================================================
   CONTROLADOR DE INCIDENTES (src/controllers/incidentes.controller.js)
   Unidad 4: Node.js, Express, CRUD y Arquitectura Defensiva SOC
   Responsabilidad: Coordinar peticiones HTTP, validación de entrada,
   interacción con el Modelo y generación de respuestas REST estandarizadas.
   ========================================================================== */
'use strict';

const { incidentesModel } = require('../models/incidentes.model');

/**
 * GET /api/incidentes
 * Retorna la lista de incidentes. Admite filtros opcionales por query:
 * ?severidad=critica|alta|media|baja
 * ?estado=texto
 * ?busqueda=texto
 */
function listarIncidentes(req, res, next) {
  try {
    const filtros = {
      severidad: req.query.severidad,
      estado: req.query.estado,
      busqueda: req.query.busqueda
    };

    const incidentes = incidentesModel.obtenerTodos(filtros);
    res.status(200).json(incidentes);
  } catch (error) {
    next(error);
  }
}

/**
 * GET /api/incidentes/:id
 * Retorna el detalle de un incidente clínico específico por su código.
 */
function obtenerIncidentePorId(req, res, next) {
  try {
    const { id } = req.params;
    const incidente = incidentesModel.obtenerPorId(id);

    if (!incidente) {
      return res.status(404).json({
        exito: false,
        error: `Incidente con código "${id}" no encontrado.`,
        codigo: 404
      });
    }

    res.status(200).json(incidente);
  } catch (error) {
    next(error);
  }
}

/**
 * POST /api/incidentes
 * Crea un nuevo incidente sanitario en memoria tras validación estricta.
 * Responde con 201 Created y el nuevo recurso.
 */
function crearIncidente(req, res, next) {
  try {
    const nuevoIncidente = incidentesModel.crear(req.body);
    res.status(201).json({
      exito: true,
      mensaje: `Incidente ${nuevoIncidente.codigo} registrado exitosamente.`,
      datos: nuevoIncidente
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PUT o PATCH /api/incidentes/:id
 * Actualiza parcialmente o totalmente el estado, severidad o medidas de un incidente.
 */
function actualizarIncidente(req, res, next) {
  try {
    const { id } = req.params;
    const incidenteActualizado = incidentesModel.actualizar(id, req.body);

    res.status(200).json({
      exito: true,
      mensaje: `Incidente ${id} actualizado correctamente.`,
      datos: incidenteActualizado
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /api/incidentes/:id
 * Elimina un incidente del catálogo en memoria.
 */
function eliminarIncidente(req, res, next) {
  try {
    const { id } = req.params;
    incidentesModel.eliminar(id);

    res.status(200).json({
      exito: true,
      mensaje: `Incidente ${id} eliminado del catálogo hospitalario.`,
      codigo: 200
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarIncidentes,
  obtenerIncidentePorId,
  crearIncidente,
  actualizarIncidente,
  eliminarIncidente
};
