const { z } = require('zod');

/**
 * Contrato de entrada para POST /api/auth/login.
 * .strict() rechaza campos no esperados (p. ej. intentar enviar "rol").
 */
const loginSchema = z
  .object({
    email: z
      .string({ required_error: 'El correo es obligatorio' })
      .trim()
      .toLowerCase()
      .email('El correo no tiene un formato válido')
      .max(120, 'El correo es demasiado largo'),
    password: z
      .string({ required_error: 'La contraseña es obligatoria' })
      .min(8, 'La contraseña debe tener al menos 8 caracteres')
      .max(72, 'La contraseña no puede exceder 72 caracteres'), // límite de bcrypt
  })
  .strict();

module.exports = { loginSchema };

