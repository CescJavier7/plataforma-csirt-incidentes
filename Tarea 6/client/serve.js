/**
 * Servidor estático mínimo (sin dependencias) para el cliente web en http://localhost:5500.
 * Se sirve en un ORIGEN DISTINTO al de la API (3000) para ejercitar la política CORS real.
 * Uso: npm run client
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PUERTO = Number(process.env.CLIENT_PORT) || 5500;
const RAIZ = __dirname;
const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
};

http
  .createServer((req, res) => {
    const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    const archivo = path.normalize(path.join(RAIZ, ruta === '/' ? 'index.html' : ruta));

    // Evita path traversal (../../)
    if (!archivo.startsWith(RAIZ) || path.basename(archivo) === 'serve.js') {
      res.writeHead(403).end('Prohibido');
      return;
    }

    fs.readFile(archivo, (err, contenido) => {
      if (err) {
        res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
        return;
      }
      res.writeHead(200, {
        'Content-Type': TIPOS[path.extname(archivo)] || 'application/octet-stream',
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'Referrer-Policy': 'no-referrer',
        'Cache-Control': 'no-store',
      });
      res.end(contenido);
    });
  })
  .listen(PUERTO, () => console.log(`Cliente web disponible en http://localhost:${PUERTO}`));

