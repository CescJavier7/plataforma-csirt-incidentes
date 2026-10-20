// Capa de aplicación: garantiza el contrato antes de entregar los datos.
'use strict';
const { readIncidents } = require('./incident-repository');
// read es la función de lectura; por defecto usa el repositorio y en pruebas se puede sustituir.
async function listIncidents(read = readIncidents) {
  const incidents = await read();
  // Set guarda códigos únicos; fields define las propiedades públicas del contrato JSON.
  const codes = new Set();
  const fields = ['codigo', 'fecha', 'amenaza', 'servicio', 'severidad', 'estado'];
  // Exigimos un arreglo y revisamos cada incidente. Un arreglo vacío también es válido.
  if (!Array.isArray(incidents) || !incidents.every(item => {
    // Cada campo debe existir y contener texto no vacío.
    if (!item || !fields.every(key => typeof item[key] === 'string' && item[key].trim())) return false;
    // La expresión regular exige INC- y cuatro dígitos; el Set detecta códigos repetidos.
    if (!/^INC-\d{4}$/.test(item.codigo) || codes.has(item.codigo)) return false;
    // La fecha debe poder interpretarse y la severidad debe pertenecer al catálogo.
    if (!Number.isFinite(Date.parse(item.fecha)) || !['baja', 'media', 'alta', 'critica'].includes(item.severidad)) return false;
    codes.add(item.codigo);
    return true;
  })) throw new Error('La fuente de incidentes no cumple el contrato.');
  // Devolvemos únicamente los campos públicos; no exponemos propiedades adicionales del archivo.
  return incidents.map(item => Object.fromEntries(fields.map(key => [key, item[key]])));
}
// La capa HTTP utiliza esta función para consultar datos ya comprobados.
module.exports = { listIncidents };
