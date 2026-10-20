/* ==========================================================================
   ENRUTADOR DE INCIDENTES (src/routes/incidentes.routes.js)
   Unidad 4: Node.js, Express, CRUD y Arquitectura Defensiva SOC
   Responsabilidad: Definición semántica de rutas REST para la entidad Incidentes.
   ========================================================================== */
'use strict';

const express = require('express');
const router = express.Router();
const incidentesController = require('../controllers/incidentes.controller');

// CRUD de Incidentes
router.get('/', incidentesController.listarIncidentes);
router.get('/:id', incidentesController.obtenerIncidentePorId);
router.post('/', incidentesController.crearIncidente);
router.put('/:id', incidentesController.actualizarIncidente);
router.patch('/:id', incidentesController.actualizarIncidente);
router.delete('/:id', incidentesController.eliminarIncidente);

module.exports = router;
