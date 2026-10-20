const env = require('./config/env');
const app = require('./app');

const PORT = env.PORT;

const server = app.listen(PORT, env.HOST, () => {
  console.log('================================================================');
  console.log('  PLATAFORMA CSIRT/SOC - CENTRO DE RESPUESTA A INCIDENTES');
  console.log('================================================================');
  console.log(` Servidor HTTP activo en puerto:   ${PORT}`);
  console.log(` Modo de ejecución:                ${env.NODE_ENV}`);
  console.log(` Motor de persistencia:            ${env.PERSISTENCE === 'prisma' ? 'MySQL 8.4 (Prisma ORM)' : 'En Memoria (Mock Staging)'}`);
  console.log(` Orígenes CORS autorizados:        ${env.CLIENT_ORIGINS.join(', ')}`);
  console.log(` Panel Web (SPA):                  http://localhost:${PORT}`);
  console.log(` Healthcheck:                      http://localhost:${PORT}/api/health`);
  console.log(` API Incidentes:                   http://localhost:${PORT}/api/incidentes`);
  console.log(` Autenticación:                    POST http://localhost:${PORT}/api/auth/login`);
  console.log('================================================================');
});

// Cierre elegante (Graceful Shutdown)
const shutdown = (signal) => {
  console.log(`\n[INFO] Señal ${signal} recibida. Procediendo con el apagado controlado...`);
  server.close(async () => {
    try {
      if (env.PERSISTENCE === 'prisma') {
        const prisma = require('./config/prisma');
        if (prisma) await prisma.$disconnect();
      }
      console.log('[INFO] Conexiones finalizadas exitosamente. Proceso terminado.');
      process.exit(0);
    } catch (error) {
      console.error('[ERROR] Error durante el apagado de la base de datos:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

module.exports = server;
