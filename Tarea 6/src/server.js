const env = require('./config/env');
const app = require('./app');

const PORT = env.PORT;

const server = app.listen(PORT, env.HOST, () => {
  console.log('====================================================');
  console.log(` Servidor de Incidentes ejecutándose en puerto: ${PORT}`);
  console.log(` Entorno: ${env.NODE_ENV}`);
  console.log(` Persistencia: ${env.PERSISTENCE === 'memory' ? 'En memoria (demo)' : 'MySQL (Prisma ORM)'}`);
  console.log(` Orígenes CORS permitidos: ${env.CLIENT_ORIGINS.join(', ')}`);
  console.log(` Login:        POST http://localhost:${PORT}/api/auth/login`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/incidentes`);
  console.log(` Healthcheck:  http://localhost:${PORT}/api/health`);
  if (env.NODE_ENV === 'production') {
    console.log(' [!] En producción la API debe exponerse SOLO por HTTPS (proxy TLS).');
  }
  console.log('====================================================');
});

// Manejo de señales para cierre limpio (Graceful shutdown)
const shutdown = () => {
  console.log('\n[INFO] Cerrando servidor HTTP...');
  server.close(async () => {
    try {
      if (env.PERSISTENCE === 'prisma') {
        await require('./config/prisma').$disconnect();
      }
      console.log('[INFO] Servidor detenido correctamente.');
      process.exit(0);
    } catch (error) {
      console.error('[ERROR] No se pudieron cerrar las conexiones de base de datos:', error);
      process.exit(1);
    }
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
