require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = Number(process.env.PORT) || 3000;

const server = app.listen(PORT, () => {
  console.log('====================================================');
  console.log(` Servidor de Incidentes ejecutándose en puerto: ${PORT}`);
  console.log(` Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(` Base de datos MySQL: incidentes_db (Prisma ORM)`);
  console.log(` API Endpoint: http://localhost:${PORT}/api/incidentes`);
  console.log(` Healthcheck:  http://localhost:${PORT}/api/health`);
  console.log('====================================================');
});

// Manejo de señales para cierre limpio (Graceful shutdown)
const shutdown = () => {
  console.log('\n[INFO] Cerrando servidor HTTP y conexiones de base de datos...');
  server.close(() => {
    prisma.$disconnect()
      .then(() => {
        console.log('[INFO] Servidor HTTP y conexiones de base de datos detenidos.');
        process.exit(0);
      })
      .catch((error) => {
        console.error('[ERROR] No se pudieron cerrar las conexiones de base de datos:', error);
        process.exit(1);
      });
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = server;
