const { z } = require('zod');

const loginSchema = z.object({
  email: z
    .string({ required_error: 'El correo electrónico es obligatorio' })
    .email('Formato de correo electrónico no válido')
    .max(120, 'El correo no puede exceder 120 caracteres'),
  password: z
    .string({ required_error: 'La contraseña es obligatoria' })
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .max(72, 'La contraseña no puede exceder 72 caracteres'),
});

module.exports = {
  loginSchema,
};

