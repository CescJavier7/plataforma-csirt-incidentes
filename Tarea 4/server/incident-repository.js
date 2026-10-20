// Capa de acceso a datos: conoce el archivo, no conoce HTTP ni el DOM.
'use strict';
const { readFile } = require('node:fs/promises');
const path = require('node:path');
// __dirname es la carpeta de este módulo; la ruta funciona aunque se inicie Node desde otra carpeta.
const dataFile = path.join(__dirname, '..', 'data', 'incidentes.json');
// Lee el archivo en cada consulta. async devuelve una promesa que el servicio espera con await.
async function readIncidents() {
  // Leemos texto UTF-8 y lo convertimos a objetos JavaScript. Los errores se propagan a la capa HTTP.
  return JSON.parse(await readFile(dataFile, 'utf8'));
}
// Exponemos la lectura para que el servicio no tenga que conocer la ubicación del archivo.
module.exports = { readIncidents };
