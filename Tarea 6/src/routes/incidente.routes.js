const express = require('express');
const router = express.Router();
const incidenteController = require('../controllers/incidente.controller');
const validate = require('../middlewares/validate.middleware');
const { autenticar, permitir } = require('../middlewares/auth.middleware');
const {
  crearIncidenteSchema,
  actualizarIncidenteSchema,
  filtrosIncidenteSchema,
} = require('../schemas/incidente.schema');

/**
 * Matriz de permisos:
 *  GET    /       -> cualquier usuario autenticado
 *  GET    /:id    -> cualquier usuario autenticado
 *  POST   /       -> ANALISTA, ADMIN
 *  PUT    /:id    -> SUPERVISOR, ADMIN
 *  DELETE /:id    -> ADMIN
 *
 * Orden de la cadena: autenticar (401) -> permitir (403) -> validar (400) -> controlador.
 */

// Todas las rutas de incidentes requieren un JWT válido
router.use(autenticar);

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

// POST /api/incidentes - Crear nuevo incidente con validación Zod
router.post(
  '/',
  permitir('ANALISTA', 'ADMIN'),
  validate(crearIncidenteSchema),
  (req, res, next) => incidenteController.crear(req, res, next)
);

// PUT /api/incidentes/:id - Actualizar datos de incidente con validación Zod
router.put(
  '/:id',
  permitir('SUPERVISOR', 'ADMIN'),
  validate(actualizarIncidenteSchema),
  (req, res, next) => incidenteController.actualizar(req, res, next)
);

// DELETE /api/incidentes/:id - Eliminar incidente por identificador
router.delete(
  '/:id',
  permitir('ADMIN'),
  (req, res, next) => incidenteController.eliminar(req, res, next)
);

module.exports = router;
