// Capa HTTP: rutas, métodos, códigos de estado y entrega del cliente.
'use strict';
// Módulos integrados de Node.js: HTTP para conexiones, fs para leer archivos y path para rutas.
const http = require('node:http');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const { listIncidents } = require('./incident-service');
const root = path.join(__dirname, '..');

// Lista explícita de archivos públicos para entrega segura sin exposición de archivos internos
const publicFiles = new Map([
  ['/', ['index.html', 'text/html']],
  ['/index.html', ['index.html', 'text/html']],
  ['/styles.css', ['css/styles.css', 'text/css']],
  ['/app.js', ['js/app.js', 'text/javascript']],
  ['/public/index.html', ['public/index.html', 'text/html']],
  ['/public/styles.css', ['public/styles.css', 'text/css']],
  ['/public/app.js', ['public/app.js', 'text/javascript']],
  ['/public/css/styles.css', ['public/css/styles.css', 'text/css']],
  ['/public/js/app.js', ['public/js/app.js', 'text/javascript']],
  ['/proyecto-incidentes-tema1/index.html', ['proyecto-incidentes-tema1/index.html', 'text/html']],
  ['/css/styles.css', ['css/styles.css', 'text/css']],
  ['/data/incidentes.json', ['data/incidentes.json', 'application/json']],
  ['/js/vendor/jquery.min.js', ['js/vendor/jquery.min.js', 'text/javascript']],
  ['/js/model.js', ['js/model.js', 'text/javascript']],
  ['/js/view.js', ['js/view.js', 'text/javascript']],
  ['/js/controller.js', ['js/controller.js', 'text/javascript']],
  ['/js/modelo.js', ['js/modelo.js', 'text/javascript']],
  ['/js/vista.js', ['js/vista.js', 'text/javascript']],
  ['/js/controlador.js', ['js/controlador.js', 'text/javascript']],
  ['/js/app.js', ['js/app.js', 'text/javascript']]
]);

// Respuesta común HTTP con cabeceras defensivas y CORS
function send(res, status, body, type = 'application/json', headers = {}) {
  const payload = type === 'application/json' ? JSON.stringify(body) : body;
  res.writeHead(status, {
    'Content-Type': `${type}; charset=utf-8`,
    'Content-Length': Buffer.byteLength(payload),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    ...headers
  });
  res.end(payload);
}

// Fábrica del servidor HTTP nativo
function createApp({ list = listIncidents } = {}) {
  return http.createServer(async (req, res) => {
    let pathname;
    try { pathname = new URL(req.url, 'http://localhost').pathname; }
    catch { send(res, 400, { error: 'Petición inválida.' }); return; }

    // Validación de rutas permitidas
    const esRutaApi = pathname === '/api/incidentes' || pathname === '/api/salud';
    if (!esRutaApi && !publicFiles.has(pathname)) {
      send(res, 404, { error: 'Ruta no encontrada.' });
      return;
    }

    // Negociación preflight CORS (OPTIONS)
    if (req.method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Accept',
        'Access-Control-Max-Age': '86400'
      });
      res.end();
      return;
    }

    // Validación de método HTTP (solo GET permitido para lectura de datos)
    if (req.method !== 'GET') {
      send(res, 405, { error: 'Método no permitido. Utilice GET.' }, 'application/json', { Allow: 'GET' });
      return;
    }

    try {
      // 1. Ruta de monitoreo de salud del servidor (Health Check)
      if (pathname === '/api/salud') {
        send(res, 200, {
          estado: 'activo',
          servicio: 'SOC Hospital Clínico San Rafael',
          uptimeSegundos: Math.floor(process.uptime()),
          timestamp: new Date().toISOString()
        });
        return;
      }

      // 2. Ruta de catálogo de incidentes sanitarios
      if (pathname === '/api/incidentes') {
        send(res, 200, await list());
        return;
      }

      // 3. Entrega de archivos estáticos del front-end mediante lectura asíncrona no bloqueante
      const [file, type] = publicFiles.get(pathname);
      send(res, 200, await readFile(path.join(root, file)), type);

    } catch {
      send(res, 500, { error: 'No se pudo completar la solicitud. Intente nuevamente.' });
    }
  });
}

module.exports = { createApp };
