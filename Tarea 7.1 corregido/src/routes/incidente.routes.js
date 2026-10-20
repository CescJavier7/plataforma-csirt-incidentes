const { Router } = require("express");
const IncidenteController = require("../controllers/incidente.controller");
const { validarIdIncidente } = require("../middlewares/validar-id.middleware");
const rateLimit = require("express-rate-limit");
const { autenticarUsuario, permitir } = require("../middlewares/autenticar-editor.middleware");

const router = Router();
const limitadorApi = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiadas solicitudes; intente nuevamente más tarde." },
});
const limitadorCambios = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados cambios; intente nuevamente más tarde." },
});
const limitadorCredenciales = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  skipSuccessfulRequests: true,
  requestWasSuccessful: (_req, res) => res.statusCode !== 401,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Demasiados intentos de autenticación; espere 15 minutos." },
});

router.use((req, res, next) => {
  res.set("Cache-Control", "private, no-store");
  next();
});
router.use(limitadorApi);
router.use(limitadorCredenciales);
router.use(autenticarUsuario);

router.get("/incidentes", IncidenteController.listar);
router.get("/incidentes/:id", validarIdIncidente, IncidenteController.obtenerPorId);
router.patch(
  "/incidentes/:id/estado",
  limitadorCambios,
  permitir("SUPERVISOR", "ADMIN"),
  validarIdIncidente,
  IncidenteController.actualizarEstado
);

module.exports = router;