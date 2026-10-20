require('dotenv').config();
const { z } = require('zod');

/**
 * Validación y exportación centralizada de variables de entorno.
 * Si falta una variable crítica (p. ej. JWT_SECRET) la aplicación no arranca.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('127.0.0.1'),
  JWT_SECRET: z
    .string({ required_error: 'JWT_SECRET es obligatorio' })
    .min(32, 'JWT_SECRET debe tener al menos 32 caracteres'),
  JWT_EXPIRES_IN: z.string().default('1h'),
  CLIENT_ORIGIN: z.string().default('http://localhost:5500'),
  // 'prisma' (MySQL) o 'memory' (demo/pruebas sin base de datos)
  PERSISTENCE: z.enum(['prisma', 'memory']).default('prisma'),
  ADMIN_PASSWORD: z.string().min(12, 'ADMIN_PASSWORD debe tener al menos 12 caracteres'),
  SUPERVISOR_PASSWORD: z.string().min(12, 'SUPERVISOR_PASSWORD debe tener al menos 12 caracteres'),
  ANALISTA_PASSWORD: z.string().min(12, 'ANALISTA_PASSWORD debe tener al menos 12 caracteres'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const detalles = parsed.error.errors
    .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
    .join('\n');
  throw new Error(`Configuración de entorno inválida:\n${detalles}`);
}

const env = {
  ...parsed.data,
  // Permite varios orígenes separados por coma: "http://localhost:5500,http://127.0.0.1:5500"
  CLIENT_ORIGINS: parsed.data.CLIENT_ORIGIN.split(',').map((o) => o.trim()).filter(Boolean),
};

module.exports = env;
