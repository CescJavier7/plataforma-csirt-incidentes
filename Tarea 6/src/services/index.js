const env = require('../config/env');

/**
 * Selecciona la implementación de persistencia según PERSISTENCE:
 *  - 'prisma' (por defecto): MySQL mediante Prisma ORM.
 *  - 'memory': almacenamiento en memoria (demos / pruebas sin base de datos).
 * Se usa require perezoso para no cargar Prisma cuando no se necesita.
 */
module.exports =
  env.PERSISTENCE === 'memory'
    ? require('./incidente.memory.service')
    : require('./incidente.service');

