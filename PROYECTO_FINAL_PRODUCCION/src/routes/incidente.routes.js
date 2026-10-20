const { Router } = require('express');
const incidenteController = require('../controllers/incidente.controller');
const { autenticar, permitir } = require('../middlewares/auth.middleware');
const { validar, validateQuery } = require('../middlewares/validate.middleware');
const { validarIdIncidente } = require('../middlewares/validar-id.middleware');
const {
  crearIncidenteSchema,
  actualizarIncidenteSchema,
  listarIncidentesQuerySchema,
} = require('../schemas/incidente.schema');

const router = Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'private, no-store');
  next();
});

// 1. Cero Confianza: Toda ruta de incidentes requiere autenticación previa mediante JWT
router.use(autenticar);

// 2. Consulta de catálogo: Permitido para Analista, Supervisor y Administrador
router.get('/', validateQuery(listarIncidentesQuerySchema), incidenteController.listar);

// 3. Consulta por ID: Permitido para todos los roles autenticados
router.get('/:id', validarIdIncidente, incidenteController.obtenerPorId);

// 4. Registro de incidentes: Analista, Supervisor y Administrador
router.post(
  '/',
  permitir('Analista', 'Supervisor', 'Administrador'),
  validar(crearIncidenteSchema),
  incidenteController.crear
);

// 5. Modificación de estado / prioridad: Supervisor y Administrador
router.put(
  '/:id',
  permitir('Supervisor', 'Administrador'),
  validarIdIncidente,
  validar(actualizarIncidenteSchema),
  incidenteController.actualizar
);

router.patch(
  '/:id',
  permitir('Supervisor', 'Administrador'),
  validarIdIncidente,
  validar(actualizarIncidenteSchema),
  incidenteController.actualizar
);

// 6. Eliminación de registros: Exclusivo para Administrador
router.delete(
  '/:id',
  permitir('Administrador'),
  validarIdIncidente,
  incidenteController.eliminar
);

module.exports = router;
