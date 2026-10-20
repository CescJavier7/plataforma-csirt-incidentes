const bcrypt = require('bcryptjs');
const prisma = require('./src/config/prisma');
const env = require('./src/config/env');

const SALT_ROUNDS = 12;

const usuariosSeed = [
  {
    nombre: 'Ana Admin',
    email: 'admin@incidentes.com',
    rol: 'ADMIN',
    password: env.ADMIN_PASSWORD,
  },
  {
    nombre: 'Sergio Supervisor',
    email: 'supervisor@incidentes.com',
    rol: 'SUPERVISOR',
    password: env.SUPERVISOR_PASSWORD,
  },
  {
    nombre: 'Laura Analista',
    email: 'analista@incidentes.com',
    rol: 'ANALISTA',
    password: env.ANALISTA_PASSWORD,
  },
];

async function seed() {
  console.log('[SEED] Iniciando siembra segura de usuarios...');

  for (const u of usuariosSeed) {
    const passwordHash = await bcrypt.hash(u.password, SALT_ROUNDS);

    await prisma.usuario.upsert({
      where: { email: u.email },
      update: {
        nombre: u.nombre,
        passwordHash,
        rol: u.rol,
      },
      create: {
        nombre: u.nombre,
        email: u.email,
        passwordHash,
        rol: u.rol,
      },
    });

    console.log(`[SEED] Usuario aprovisionado: ${u.email} [${u.rol}] (contraseña hasheada con bcrypt)`);
  }

  console.log('[SEED] Siembra completada con éxito.');
}

if (require.main === module) {
  seed()
    .catch((e) => {
      console.error('[SEED ERROR]', e);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}

module.exports = { seed, usuariosSeed };
