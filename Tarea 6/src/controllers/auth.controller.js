const authService = require('../services/auth.service');
const { crearToken } = require('../utils/token');

/**
 * POST /api/auth/login
 * Body (ya validado por Zod): { email, password }
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const usuario = await authService.buscarPorEmail(email);
    const coincide = await authService.verificarPassword(usuario, password);

    if (!usuario || !coincide) {
      // Mensaje genérico: no revela si falló el correo o la contraseña (prevención de enumeración)
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas',
        error: 'INVALID_CREDENTIALS',
      });
    }

    const token = crearToken(usuario);

    return res.status(200).json({
      success: true,
      message: 'Inicio de sesión exitoso',
      data: {
        token,
        tipo: 'Bearer',
        usuario: {
          id: usuario.id,
          nombre: usuario.nombre,
          email: usuario.email,
          rol: usuario.rol,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { login };
