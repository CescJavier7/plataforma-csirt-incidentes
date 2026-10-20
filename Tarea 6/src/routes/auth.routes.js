const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const { login } = require('../controllers/auth.controller');
const validate = require('../middlewares/validate.middleware');
const { loginSchema } = require('../schemas/auth.schema');

// Límite estricto contra fuerza bruta: 10 intentos por IP cada 15 minutos
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skipSuccessfulRequests: true, // solo cuentan los intentos fallidos
  message: {
    success: false,
    message: 'Demasiados intentos de inicio de sesión. Intente más tarde.',
    error: 'TOO_MANY_REQUESTS',
  },
});

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), login);

module.exports = router;

