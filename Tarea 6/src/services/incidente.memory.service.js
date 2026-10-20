/**
 * Implementación EN MEMORIA del servicio de incidentes.
 * Misma interfaz que incidente.service.js (Prisma/MySQL). Se usa con PERSISTENCE=memory
 * para demos y pruebas automatizadas cuando no hay un servidor MySQL disponible.
 */
class IncidenteMemoryService {
  constructor() {
    this.reset();
  }

  reset() {
    this.incidentes = [];
    this.siguienteId = 1;
  }

  static errorId() {
    const error = new Error('El identificador debe ser un entero positivo');
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
    if (!Number.isSafeInteger(parsedId) || parsedId <= 0) throw IncidenteMemoryService.errorId();

    const incidente = this.incidentes.find((i) => i.id === parsedId);
    if (!incidente) {
      const error = new Error('Recurso no encontrado');
      error.statusCode = 404;
      error.code = 'INCIDENTE_NO_ENCONTRADO';
      throw error;
    }
    return incidente;
  }

  async actualizarIncidente(id, data) {
    const incidente = await this.obtenerIncidentePorId(id);
    Object.assign(incidente, data, { updatedAt: new Date() });
    return { ...incidente };
  }

  async eliminarIncidente(id) {
    const incidente = await this.obtenerIncidentePorId(id);
    this.incidentes = this.incidentes.filter((i) => i.id !== incidente.id);
    return { ...incidente };
  }
}

module.exports = new IncidenteMemoryService();

