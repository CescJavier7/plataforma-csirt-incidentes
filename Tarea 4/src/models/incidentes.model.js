/* ==========================================================================
   MODELO EN MEMORIA DE INCIDENTES (src/models/incidentes.model.js)
   Unidad 4: Node.js, Express, CRUD y Arquitectura Defensiva SOC
   Responsabilidad: Gestión del almacén de incidentes en memoria,
   validación Zero-Trust de esquemas e integridad de datos clínicos.
   ========================================================================== */
'use strict';

const fs = require('node:fs');
const path = require('node:path');

// Colección inicial simulada con datos de incidentes hospitalarios
const SEVERIDADES_VALIDAS = new Set(['baja', 'media', 'alta', 'critica']);

// Cargar incidentes base desde el archivo JSON si existe, o usar datos por defecto
function cargarIncidentesBase() {
  const rutaJson = path.join(__dirname, '../../data/incidentes.json');
  try {
    if (fs.existsSync(rutaJson)) {
      const contenido = fs.readFileSync(rutaJson, 'utf8');
      const datos = JSON.parse(contenido);
      if (Array.isArray(datos)) {
        return datos.map(item => ({ ...item }));
      }
    }
  } catch (error) {
    console.warn('[MODELO] Advertencia: No se pudo leer data/incidentes.json, usando base por defecto.');
  }

  return [
    {
      codigo: 'INC-2041',
      fecha: '2026-09-11T11:20:00',
      amenaza: 'Intento de Ransomware en Servidor HIS (Historias Clínicas)',
      servicio: 'Servidor Central EHR / Archivo',
      severidad: 'critica',
      estado: 'Aislamiento VLAN'
    },
    {
      codigo: 'INC-2040',
      fecha: '2026-09-11T10:35:00',
      amenaza: 'Anomalía de Tráfico en Pasarela IoMT (Bombas de Infusión)',
      servicio: 'Pabellón UCI — Cama 04 a 12',
      severidad: 'alta',
      estado: 'Inspección Biomédica'
    },
    {
      codigo: 'INC-2039',
      fecha: '2026-09-11T09:12:00',
      amenaza: 'Fuga Potencial en Servidor PACS (Imágenes Radiológicas/DICOM)',
      servicio: 'Imagenología / Tomografía TAC',
      severidad: 'media',
      estado: 'Bloqueo IP Externa'
    },
    {
      codigo: 'INC-2038',
      fecha: '2026-09-11T07:45:00',
      amenaza: 'Campaña de Spear Phishing a Personal de Farmacia y Urgencias',
      servicio: 'Estaciones Dispensación Farmacia',
      severidad: 'baja',
      estado: 'Mitigado / Credenciales Revocadas'
    }
  ];
}

class IncidentesModel {
  constructor(datosIniciales = null) {
    this.incidentes = Array.isArray(datosIniciales) ? datosIniciales : cargarIncidentesBase();
  }

  /**
   * Obtiene todos los incidentes aplicando filtros opcionales (severidad, estado, búsqueda).
   * @param {Object} filtros
   * @returns {Array} Copia inmutable de la lista de incidentes.
   */
  obtenerTodos(filtros = {}) {
    let resultado = [...this.incidentes];

    if (filtros.severidad && filtros.severidad !== 'todas') {
      const sev = String(filtros.severidad).toLowerCase().trim();
      resultado = resultado.filter(inc => inc.severidad.toLowerCase() === sev);
    }

    if (filtros.estado) {
      const est = String(filtros.estado).toLowerCase().trim();
      resultado = resultado.filter(inc => inc.estado.toLowerCase().includes(est));
    }

    if (filtros.busqueda) {
      const q = String(filtros.busqueda).toLowerCase().trim();
      resultado = resultado.filter(inc =>
        inc.codigo.toLowerCase().includes(q) ||
        inc.amenaza.toLowerCase().includes(q) ||
        inc.servicio.toLowerCase().includes(q) ||
        inc.estado.toLowerCase().includes(q)
      );
    }

    return resultado.map(item => ({ ...item }));
  }

  /**
   * Busca un incidente por su código identificador único (ej. INC-2041).
   * @param {string} codigo
   * @returns {Object|null}
   */
  obtenerPorId(codigo) {
    if (!codigo) return null;
    const codigoNorm = String(codigo).toUpperCase().trim();
    const encontrado = this.incidentes.find(inc => inc.codigo.toUpperCase() === codigoNorm);
    return encontrado ? { ...encontrado } : null;
  }

  /**
   * Crea y valida un nuevo incidente en memoria.
   * Aplica principios Zero-Trust: no confía en datos del cliente.
   * @param {Object} datos
   * @returns {Object} Incidente creado
   */
  crear(datos) {
    if (!datos || typeof datos !== 'object') {
      const err = new Error('Los datos del incidente son requeridos y deben ser un objeto JSON.');
      err.statusCode = 400;
      throw err;
    }

    const codigo = datos.codigo ? String(datos.codigo).toUpperCase().trim() : '';
    if (!codigo || !/^INC-[0-9]{4}$/.test(codigo)) {
      const err = new Error('El código de incidente debe cumplir con el formato hospitalario INC-XXXX (ejemplo: INC-2042).');
      err.statusCode = 400;
      throw err;
    }

    if (this.incidentes.some(inc => inc.codigo.toUpperCase() === codigo)) {
      const err = new Error(`El código de incidente ${codigo} ya está registrado en el sistema.`);
      err.statusCode = 409; // Conflicto
      throw err;
    }

    const amenaza = datos.amenaza ? String(datos.amenaza).trim() : '';
    if (!amenaza || amenaza.length < 5) {
      const err = new Error('La descripción del vector o amenaza debe tener al menos 5 caracteres.');
      err.statusCode = 400;
      throw err;
    }

    const servicio = datos.servicio ? String(datos.servicio).trim() : '';
    if (!servicio || servicio.length < 3) {
      const err = new Error('El servicio hospitalario afectado es obligatorio (mínimo 3 caracteres).');
      err.statusCode = 400;
      throw err;
    }

    const severidad = datos.severidad ? String(datos.severidad).toLowerCase().trim() : '';
    if (!SEVERIDADES_VALIDAS.has(severidad)) {
      const err = new Error('La severidad debe ser una de las siguientes: baja, media, alta, critica.');
      err.statusCode = 400;
      throw err;
    }

    let fecha = datos.fecha ? String(datos.fecha).trim() : new Date().toISOString();
    const parsedDate = Date.parse(fecha);
    if (!Number.isFinite(parsedDate)) {
      const err = new Error('La fecha de detección especificada no tiene un formato válido.');
      err.statusCode = 400;
      throw err;
    }

    const estado = datos.estado ? String(datos.estado).trim() : 'Pendiente de triaje';

    const nuevoIncidente = {
      codigo,
      fecha,
      amenaza,
      servicio,
      severidad,
      estado,
      ...(datos.activo ? { activo: String(datos.activo).trim() } : {}),
      ...(datos.analista ? { analista: String(datos.analista).trim() } : {}),
      ...(datos.descripcion ? { descripcion: String(datos.descripcion).trim() } : {}),
      ...(datos.acciones ? { acciones: String(datos.acciones).trim() } : {}),
      creadoEn: new Date().toISOString()
    };

    // Insertar al inicio de la lista en memoria (más reciente primero)
    this.incidentes.unshift(nuevoIncidente);
    return { ...nuevoIncidente };
  }

  /**
   * Actualiza los datos de un incidente existente por su código.
   * @param {string} codigo
   * @param {Object} datos
   * @returns {Object} Incidente actualizado
   */
  actualizar(codigo, datos) {
    if (!codigo) {
      const err = new Error('El código del incidente es obligatorio.');
      err.statusCode = 400;
      throw err;
    }

    const codigoNorm = String(codigo).toUpperCase().trim();
    const indice = this.incidentes.findIndex(inc => inc.codigo.toUpperCase() === codigoNorm);

    if (indice === -1) {
      const err = new Error(`No se encontró el incidente con código ${codigoNorm}.`);
      err.statusCode = 404;
      throw err;
    }

    const incidenteActual = this.incidentes[indice];

    // Validación defensiva de los campos modificables
    if (datos.severidad !== undefined) {
      const sev = String(datos.severidad).toLowerCase().trim();
      if (!SEVERIDADES_VALIDAS.has(sev)) {
        const err = new Error('La severidad debe ser: baja, media, alta o critica.');
        err.statusCode = 400;
        throw err;
      }
      incidenteActual.severidad = sev;
    }

    if (datos.estado !== undefined) {
      const est = String(datos.estado).trim();
      if (!est) {
        const err = new Error('El estado no puede ser una cadena vacía.');
        err.statusCode = 400;
        throw err;
      }
      incidenteActual.estado = est;
    }

    if (datos.amenaza !== undefined) {
      const am = String(datos.amenaza).trim();
      if (am.length < 5) {
        const err = new Error('La amenaza debe contener al menos 5 caracteres.');
        err.statusCode = 400;
        throw err;
      }
      incidenteActual.amenaza = am;
    }

    if (datos.servicio !== undefined) {
      const serv = String(datos.servicio).trim();
      if (serv.length < 3) {
        const err = new Error('El servicio debe contener al menos 3 caracteres.');
        err.statusCode = 400;
        throw err;
      }
      incidenteActual.servicio = serv;
    }

    if (datos.acciones !== undefined) {
      incidenteActual.acciones = String(datos.acciones).trim();
    }

    incidenteActual.actualizadoEn = new Date().toISOString();
    return { ...incidenteActual };
  }

  /**
   * Elimina un incidente de la memoria por su código.
   * @param {string} codigo
   * @returns {boolean} true si fue eliminado
   */
  eliminar(codigo) {
    if (!codigo) {
      const err = new Error('El código del incidente es obligatorio.');
      err.statusCode = 400;
      throw err;
    }

    const codigoNorm = String(codigo).toUpperCase().trim();
    const indice = this.incidentes.findIndex(inc => inc.codigo.toUpperCase() === codigoNorm);

    if (indice === -1) {
      const err = new Error(`No se encontró el incidente con código ${codigoNorm}.`);
      err.statusCode = 404;
      throw err;
    }

    this.incidentes.splice(indice, 1);
    return true;
  }

  /**
   * Restablece la colección a los incidentes base (útil para pruebas y reinicios).
   */
  reiniciar(datos = null) {
    this.incidentes = Array.isArray(datos) ? datos.map(i => ({ ...i })) : cargarIncidentesBase();
    return this.incidentes;
  }
}

// Instancia singleton por defecto para el servidor
const instanciaModelo = new IncidentesModel();

module.exports = {
  IncidentesModel,
  incidentesModel: instanciaModelo
};
