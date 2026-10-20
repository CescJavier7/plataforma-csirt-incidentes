const { PrismaClient } = require('@prisma/client');

let prisma;

if (process.env.PERSISTENCE === 'memory') {
  prisma = null;
} else {
  prisma = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });
}

module.exports = prisma;

