const { Router } = require("express");
const IncidenteController = require("../controllers/incidente.controller");
const { validarIdIncidente } = require("../middlewares/validar-id.middleware");

const router = Router();

router.get("/incidentes", IncidenteController.listar);
router.get("/incidentes/:id", validarIdIncidente, IncidenteController.obtenerPorId);
router.patch("/incidentes/:id/estado", validarIdIncidente, IncidenteController.actualizarEstado);

module.exports = router;