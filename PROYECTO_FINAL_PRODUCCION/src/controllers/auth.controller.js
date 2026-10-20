const authService = require('../services/auth.service');

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      const resultado = await authService.login(email, password);

      return res.status(200).json({
        success: true,
        message: 'Autenticación exitosa',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();

