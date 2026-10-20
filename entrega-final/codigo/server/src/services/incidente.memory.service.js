const { puedeCambiarEstado } = require('../utils/estado');

class IncidenteMemoryService {
  constructor() {
    this.reset();
  }

  reset() {
    this.incidentes = [
      {
        id: 1,
        titulo: 'Intento de intrusión por fuerza bruta SSH',
        descripcion: 'Detección de más de 500 intentos de autenticación fallida desde la subred 198.51.100.42.',
        prioridad: 'ALTA',
        estado: 'EN_PROCESO',
        resolucion: null,
        createdAt: new Date('2026-10-18T10:00:00Z'),
        updatedAt: new Date('2026-10-18T10:30:00Z'),
      },
      {
        id: 2,
        titulo: 'Detección de ransomware LockBit en endpoint',
        descripcion: 'Alerta EDR en la estación WS-FIN-09 tras ejecución de macro maliciosa.',
        prioridad: 'CRITICA',
        estado: 'ABIERTO',
        resolucion: null,
        createdAt: new Date('2026-10-19T08:00:00Z'),
        updatedAt: new Date('2026-10-19T08:00:00Z'),
      },
      {
        id: 3,
        titulo: 'Fallo de certificado TLS perimetral',
        descripcion: 'Certificado caducado en subdominio portal.empresa.com.',
        prioridad: 'BAJA',
        estado: 'CERRADO',
        resolucion: 'Renovado certificado con Certbot y reiniciado Nginx exitosamente.',
        createdAt: new Date('2026-10-17T12:00:00Z'),
        updatedAt: new Date('2026-10-17T14:00:00Z'),
      },
    ];
    this.siguienteId = 4;
  }

  static errorId() {
    const error = new Error('El identificador del incidente debe ser un entero positivo');
    error.statusCode = 400;
    error.code = 'INVALID_ID';
    return error;
  }

  async crearIncidente(data) {
    const ahora = new Date();
    const incidente = {
      id: this.siguienteId++,
      titulo: data.titulo,
      descripcion: data.descripcion,
      resolucion: data.resolucion || null,
      prioridad: data.prioridad || 'MEDIA',
      estado: data.estado || 'ABIERTO',
      createdAt: ahora,
      updatedAt: ahora,
    };
    this.incidentes.push(incidente);
    return { ...incidente };
  }

  async listarIncidentes(filtros = {}) {
    return this.incidentes
      .filter((i) => !filtros.estado || i.estado === filtros.estado)
      .filter((i) => !filtros.prioridad || i.prioridad === filtros.prioridad)
      .sort((a, b) => b.createdAt - a.createdAt || b.id - a.id)
      .map((i) => ({ ...i }));
  }

  async obtenerIncidentePorId(id) {
    const parsedId = Number(id);
    if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
      throw IncidenteMemoryService.errorId();
    }

    const incidente = this.incidentes.find((i) => i.id === parsedId);
    if (!incidente) {
      const error = new Error('Recurso no encontrado');
      error.statusCode = 404;
      error.code = 'INCIDENTE_NO_ENCONTRADO';
      throw error;
    }
    return { ...incidente };
  }

  async actualizarIncidente(id, data) {
    const parsedId = Number(id);
    const incidente = this.incidentes.find((i) => i.id === parsedId);
    if (!incidente) {
      const error = new Error('Recurso no encontrado');
      error.statusCode = 404;
      error.code = 'INCIDENTE_NO_ENCONTRADO';
      throw error;
    }

    // Validación de transición de estados de negocio (ITIL)
    if (data.estado && data.estado !== incidente.estado) {
      const validacion = puedeCambiarEstado(
        incidente.estado,
        data.estado,
        data.resolucion !== undefined ? data.resolucion : incidente.resolucion
      );
      if (!validacion.valido) {
        const error = new Error(validacion.razon);
        error.statusCode = 400;
        error.code = 'INVALID_STATE_TRANSITION';
        throw error;
      }
    }

    Object.assign(incidente, data, { updatedAt: new Date() });
    return { ...incidente };
  }

  async eliminarIncidente(id) {
    const parsedId = Number(id);
    const index = this.incidentes.findIndex((i) => i.id === parsedId);
    if (index === -1) {
      const error = new Error('Recurso no encontrado');
      error.statusCode = 404;
      error.code = 'INCIDENTE_NO_ENCONTRADO';
      throw error;
    }
    const [eliminado] = this.incidentes.splice(index, 1);
    return eliminado;
  }
}

module.exports = new IncidenteMemoryService();

