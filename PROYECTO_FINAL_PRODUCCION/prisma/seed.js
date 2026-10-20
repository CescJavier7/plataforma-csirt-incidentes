const bcrypt = require('bcryptjs');
const prisma = require('../src/config/prisma');
const env = require('../src/config/env');

// Factor de costo criptográfico >= 12 según sección A04 de skill_seguridad.md
const SALT_ROUNDS = 12;

const usuariosSeed = [
  {
    nombre: 'Ana Administradora CSIRT',
    email: 'admin@incidentes.com',
    rol: 'ADMIN',
    password: env.adminPassword,
  },
  {
    nombre: 'Sergio Supervisor SOC',
    email: 'supervisor@incidentes.com',
    rol: 'SUPERVISOR',
    password: env.supervisorPassword,
  },
  {
    nombre: 'Laura Analista Nivel 1',
    email: 'analista@incidentes.com',
    rol: 'ANALISTA',
    password: env.analistaPassword,
  },
];

const incidentesSeed = [
  {
    titulo: 'Intento de intrusión por fuerza bruta SSH',
    descripcion: 'Detección de más de 500 intentos de autenticación fallida desde la subred externa 198.51.100.42 contra el host perimetral.',
    prioridad: 'ALTA',
    estado: 'EN_PROCESO',
  },
  {
    titulo: 'Detección de malware Ransomware LockBit en endpoint',
    descripcion: 'Alerta del EDR en la estación de trabajo WS-FIN-09 tras ejecución de macro maliciosa proveniente de correo spear-phishing.',
    prioridad: 'CRITICA',
    estado: 'ABIERTO',
  },
  {
    titulo: 'Exfiltración anómala de datos en servidor de base de datos',
    descripcion: 'Pico de transferencia de 15 GB fuera del horario habitual hacia almacenamiento S3 público no corporativo.',
    prioridad: 'CRITICA',
    estado: 'EN_PROCESO',
  },
  {
    titulo: 'Campaña de phishing dirigida a RRHH',
    descripcion: 'Recepción de 14 correos simulando ser del portal de nómina solicitando restablecimiento de credenciales bancarias.',
    prioridad: 'MEDIA',
    estado: 'RESUELTO',
    resolucion: 'Bloqueo de remitente en Secure Email Gateway y rotación forzada de contraseñas de las cuentas alcanzadas.',
  },
  {
    titulo: 'Fallo de integridad en certificado SSL perimetral',
    descripcion: 'Alerta de expiración de certificado TLS en el portal de clientes corporativo.',
    prioridad: 'BAJA',
    estado: 'CERRADO',
    resolucion: 'Renovación automática vía Let\'s Encrypt Certbot y reinicio en caliente del proxy Nginx verificado.',
  },
];

async function seed() {
  console.log('[SEED] Iniciando siembra segura de la Plataforma CSIRT (Bcrypt costo 12)...');

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

    console.log(`[SEED] Usuario aprovisionado: ${u.email} [${u.rol}] (Bcrypt costo ${SALT_ROUNDS})`);
  }

  const count = await prisma.incidente.count();
  if (count === 0) {
    for (const inc of incidentesSeed) {
      await prisma.incidente.create({ data: inc });
    }
    console.log(`[SEED] ${incidentesSeed.length} incidentes base registrados exitosamente.`);
  } else {
    console.log(`[SEED] La tabla de incidentes ya contenía ${count} registros.`);
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

module.exports = { seed, usuariosSeed, incidentesSeed };
