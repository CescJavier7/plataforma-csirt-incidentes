require('dotenv').config();

const { PrismaClient } = require('@prisma/client');

// Instancia singleton de PrismaClient para reutilizar el pool de conexiones
const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

module.exports = prisma;
