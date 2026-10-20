const env = require('../config/env');
const prisma = require('../config/prisma');

let service;

if (env.PERSISTENCE === 'prisma' && prisma) {
  service = require('./incidente.service');
} else {
  service = require('./incidente.memory.service');
}

module.exports = service;

