const { Router } = require('express');
const authController = require('../controllers/auth.controller');
const { validar } = require('../middlewares/validate.middleware');
const { loginSchema } = require('../schemas/auth.schema');

const router = Router();

// El rate limiting estricto se aplica a nivel de app.js sobre /api/auth
router.post('/login', validar(loginSchema), authController.login);

module.exports = router;
