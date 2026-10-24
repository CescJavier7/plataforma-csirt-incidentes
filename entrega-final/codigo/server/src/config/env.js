const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const persistenceMode = process.env.PERSISTENCE || (process.env.DATABASE_URL ? 'prisma' : 'memory');

// Validación de Cero Confianza y Fallo Seguro (Fail-Fast) según skill_seguridad.md
const variablesObligatorias = [
  'JWT_SECRET',
  'CLIENT_ORIGIN',
  'ADMIN_PASSWORD',
  'SUPERVISOR_PASSWORD',
  'ANALISTA_PASSWORD',
];

if (persistenceMode === 'prisma') {
  variablesObligatorias.push('DATABASE_URL');
}

const faltantes = variablesObligatorias.filter((nombre) => !process.env[nombre]);

if (faltantes.length > 0) {
  throw new Error(
    `[CRÍTICO] Faltan las siguientes variables de entorno: ${faltantes.join(', ')}`
  );
}

if (Buffer.byteLength(process.env.JWT_SECRET, 'utf8') < 32) {
  throw new Error('[CRÍTICO] JWT_SECRET debe tener al menos 32 bytes');
}

const contrasenasIniciales = ['ADMIN_PASSWORD', 'SUPERVISOR_PASSWORD', 'ANALISTA_PASSWORD'];
const contrasenasDebiles = contrasenasIniciales.filter(
  (nombre) => Buffer.byteLength(process.env[nombre], 'utf8') < 12
);

if (contrasenasDebiles.length > 0) {
  throw new Error(
    `[CRÍTICO] Las siguientes contraseñas deben tener al menos 12 bytes: ${contrasenasDebiles.join(', ')}`
  );
}

const hostDeterminado = process.env.HOST || (process.env.RENDER || process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');

module.exports = {
  port: Number(process.env.PORT || 3000),
  PORT: Number(process.env.PORT || 3000),
  host: hostDeterminado,
  HOST: hostDeterminado,
  databaseUrl: process.env.DATABASE_URL || 'mysql://mock:mock@localhost:3306/mock_csirt',
  DATABASE_URL: process.env.DATABASE_URL || 'mysql://mock:mock@localhost:3306/mock_csirt',
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
  persistence: persistenceMode,
  PERSISTENCE: persistenceMode,
  adminPassword: process.env.ADMIN_PASSWORD,
  ADMIN_PASSWORD: process.env.ADMIN_PASSWORD,
  supervisorPassword: process.env.SUPERVISOR_PASSWORD,
  SUPERVISOR_PASSWORD: process.env.SUPERVISOR_PASSWORD,
  analistaPassword: process.env.ANALISTA_PASSWORD,
  ANALISTA_PASSWORD: process.env.ANALISTA_PASSWORD,
};
