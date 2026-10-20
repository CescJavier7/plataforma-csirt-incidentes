/* ==========================================================================
   CONFIGURACIÓN DE LA APLICACIÓN EXPRESS (src/app.js)
   Unidad 4: Node.js, Express, CRUD, Middleware y Arquitectura Defensiva SOC
   Responsabilidad: Ensamblaje de middlewares perimetrales, rutas REST,
   servicio estático controlado y manejo centralizado de errores.
   ========================================================================== */
'use strict';

const express = require('express');
const path = require('node:path');
const { readFile } = require('node:fs/promises');
const loggerMiddleware = require('./middleware/logger');
const { rutaNoEncontrada, manejadorErrores } = require('./middleware/errorHandler');
const incidentesRouter = require('./routes/incidentes.routes');
const { incidentesModel } = require('./models/incidentes.model');

const rootDir = path.join(__dirname, '..');

// Lista blanca explícita de archivos estáticos públicos autorizados
// Protege contra directory traversal y evita la exposición de archivos privados (.git, server.js, etc.)
const archivosPublicos = new Map([
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

/**
 * Fábrica de la aplicación Express
 * @param {Object} options - Inyección de dependencias para pruebas
 * @returns {express.Application}
 */
function buildExpressApp(options = {}) {
  const app = express();

  // 1. Cabeceras perimetrales de seguridad y CORS
  app.use((req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');

    if (req.method === 'OPTIONS') {
      res.setHeader('Access-Control-Max-Age', '86400');
      return res.status(204).end();
    }
    next();
  });

  // 2. Middleware de registro de peticiones (Logger)
  app.use(loggerMiddleware);

  // 3. Middlewares de parsing de solicitudes con límites defensivos
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: false, limit: '1mb' }));

  // 4. Endpoint de salud del servidor (Health Check)
  app.get('/api/salud', (req, res) => {
    res.status(200).json({
      estado: 'activo',
      servicio: 'SOC Hospital Clínico San Rafael',
      uptimeSegundos: Math.floor(process.uptime()),
      timestamp: new Date().toISOString()
    });
  });

  // Si se inyecta una función de listado personalizada (ej. en pruebas de fallos), usarla antes
  if (typeof options.list === 'function') {
    app.get('/api/incidentes', async (req, res, next) => {
      try {
        const resultado = await options.list();
        res.status(200).json(resultado);
      } catch (error) {
        next(error);
      }
    });
  }

  // 5. Rutas CRUD de la API REST de Incidentes
  app.use('/api/incidentes', incidentesRouter);

  // 6. Entrega defensiva de archivos estáticos autorizados
  app.use(async (req, res, next) => {
    // Si la ruta comienza con /api, no es estática
    if (req.path.startsWith('/api')) {
      return next();
    }

    let pathname = req.path;
    if (pathname.endsWith('/') && pathname.length > 1) {
      pathname = pathname.slice(0, -1);
    }

    if (archivosPublicos.has(pathname)) {
      const [archivoRelativo, tipoMime] = archivosPublicos.get(pathname);
      const rutaAbsoluta = path.join(rootDir, archivoRelativo);
      try {
        const contenido = await readFile(rutaAbsoluta);
        res.writeHead(200, {
          'Content-Type': `${tipoMime}; charset=utf-8`,
          'Content-Length': Buffer.byteLength(contenido),
          'Cache-Control': 'no-store'
        });
        return res.end(contenido);
      } catch (err) {
        return next(err);
      }
    }

    // Si no está en la lista blanca y no es API, responder 404
    res.status(404).json({
      exito: false,
      error: 'Ruta o recurso no encontrado.',
      codigo: 404
    });
  });

  // 7. Manejador de rutas 404 para la API
  app.use('/api', rutaNoEncontrada);

  // 8. Manejador centralizado de errores defensivo
  app.use(manejadorErrores);

  return app;
}

module.exports = {
  buildExpressApp
};
