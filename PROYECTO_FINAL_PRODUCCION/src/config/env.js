const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

// Validación de Cero Confianza y Fallo Seguro (Fail-Fast) según skill_seguridad.md
const variablesObligatorias = ['DATABASE_URL', 'JWT_SECRET', 'CLIENT_ORIGIN'];
const faltantes = variablesObligatorias.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  throw new Error(
    `[CRÍTICO] Faltan las siguientes variables de entorno: ${faltantes.join(', ')}`
  );
}

module.exports = {
  port: Number(process.env.PORT || 3000),
  PORT: Number(process.env.PORT || 3000),
  databaseUrl: process.env.DATABASE_URL,
  DATABASE_URL: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  JWT_SECRET: process.env.JWT_SECRET,
  jwtAlgorithm: 'HS256',
  JWT_ALGORITHM: 'HS256',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '30m',
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '30m',
  clientOrigin: process.env.CLIENT_ORIGIN,
  CLIENT_ORIGIN: process.env.CLIENT_ORIGIN,
  clientOrigins: (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  CLIENT_ORIGINS: (process.env.CLIENT_ORIGIN || '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  nodeEnv: process.env.NODE_ENV || 'development',
  NODE_ENV: process.env.NODE_ENV || 'development',
  persistence: process.env.PERSISTENCE || (process.env.DATABASE_URL ? 'prisma' : 'memory'),
  PERSISTENCE: process.env.PERSISTENCE || (process.env.DATABASE_URL ? 'prisma' : 'memory'),
  adminPassword: process.env.ADMIN_PASSWORD || 'Admin123!',
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'Admin123!',
  supervisorPassword: process.env.SUPERVISOR_PASSWORD || 'Supervisor123!',
  SUPERVISOR_PASSWORD: process.env.SUPERVISOR_PASSWORD || 'Supervisor123!',
  analistaPassword: process.env.ANALISTA_PASSWORD || 'Analista123!',
  ANALISTA_PASSWORD: process.env.ANALISTA_PASSWORD || 'Analista123!',
};
