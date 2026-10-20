/* ==========================================================================
   CONSTRUCTOR DEL SERVIDOR HTTP CON EXPRESS (server/app.js)
   Unidad 4: Node.js, Express, CRUD, Middleware y Arquitectura Defensiva SOC
   Responsabilidad: Integrar la aplicación Express dentro de un servidor HTTP
   estándar, garantizando compatibilidad con server.js y suites de prueba.
   ========================================================================== */
'use strict';

const http = require('node:http');
const { buildExpressApp } = require('../src/app');
const { listIncidents } = require('./incident-service');

/**
 * Crea e inicializa el servidor HTTP envolviendo la aplicación Express.
 * @param {Object} options - Parámetros de configuración o mockeo
 * @returns {http.Server}
 */
function createApp(options = {}) {
  const expressApp = buildExpressApp(options);
  const server = http.createServer(expressApp);
  return server;
}

module.exports = {
  createApp,
  buildExpressApp,
  listIncidents
};
