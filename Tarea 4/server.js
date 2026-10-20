// Punto de entrada del servidor. Sin dependencias externas.
'use strict';
// Importamos la función que construye el servidor y sus rutas.
const { createApp } = require('./server/app');
// PORT permite elegir el puerto desde la terminal; si no se define, usamos 3000.
const port = Number(process.env.PORT || 3000);
// Validamos el rango antes de intentar escuchar conexiones.
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error('PORT debe ser un entero entre 1 y 65535.');
  process.exit(1);
}
// Crear el servidor todavía no abre el puerto: eso lo hace listen más abajo.
const server = createApp();
// Tratamos errores de inicio, por ejemplo un puerto ocupado por otro programa.
server.on('error', error => {
  console.error(error.code === 'EADDRINUSE'
    ? `El puerto ${port} está ocupado. Configure otro puerto con PORT.`
    : `No se pudo iniciar el servidor: ${error.message}`);
  process.exitCode = 1;
});
// 127.0.0.1 acepta conexiones desde este equipo. El callback avisa cuando está listo.
server.listen(port, '127.0.0.1', () => {
  console.log(`SOC Hospitalario: http://127.0.0.1:${port}`);
  console.log(`API Incidentes: http://127.0.0.1:${port}/api/incidentes`);
  console.log(`API Salud: http://127.0.0.1:${port}/api/salud`);
  console.log('Detener: Ctrl+C');
});
