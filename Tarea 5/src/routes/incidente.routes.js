const express = require('express');
const router = express.Router();
const incidenteController = require('../controllers/incidente.controller');
const validate = require('../middlewares/validate.middleware');
const {
  crearIncidenteSchema,
  actualizarIncidenteSchema,
  filtrosIncidenteSchema,
} = require('../schemas/incidente.schema');

// POST /api/incidentes - Crear nuevo incidente con validación Zod
router.post(
  '/',
  validate(crearIncidenteSchema),
  (req, res, next) => incidenteController.crear(req, res, next)
);

// GET /api/incidentes - Listar incidentes con soporte para filtros (?estado= & ?prioridad=)
router.get(
  '/',
  validate(filtrosIncidenteSchema, 'query'),
  (req, res, next) => incidenteController.listar(req, res, next)
);

// GET /api/incidentes/:id - Consultar incidente por identificador numérico
router.get(
  '/:id',
  (req, res, next) => incidenteController.obtenerPorId(req, res, next)
);

// PUT /api/incidentes/:id - Actualizar datos de incidente con validación Zod
router.put(
  '/:id',
  validate(actualizarIncidenteSchema),
  (req, res, next) => incidenteController.actualizar(req, res, next)
);

// DELETE /api/incidentes/:id - Eliminar incidente por identificador
router.delete(
  '/:id',
  (req, res, next) => incidenteController.eliminar(req, res, next)
);

module.exports = router;
