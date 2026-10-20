const prisma = require('../config/prisma');
const { puedeCambiarEstado } = require('../utils/estado');

class IncidenteService {
  async crearIncidente(data) {
    return await prisma.incidente.create({
      data: {
        titulo: data.titulo,
        descripcion: data.descripcion,
        prioridad: data.prioridad,
        estado: data.estado,
        ...(data.resolucion !== undefined ? { resolucion: data.resolucion } : {}),
      },
    });
  }

  async listarIncidentes(filtros = {}) {
    const where = {};

    if (filtros.estado) {
      where.estado = filtros.estado;
    }

    if (filtros.prioridad) {
      where.prioridad = filtros.prioridad;
    }

    return await prisma.incidente.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async obtenerIncidentePorId(id) {
    const parsedId = Number(id);
    if (!Number.isSafeInteger(parsedId) || parsedId <= 0) {
      const error = new Error('El identificador debe ser un entero positivo');
      error.statusCode = 400;
      error.code = 'INVALID_ID';
      throw error;
    }

    const incidente = await prisma.incidente.findUnique({
      where: { id: parsedId },
    });

    if (!incidente) {
      const error = new Error('Recurso no encontrado');
      error.statusCode = 404;
      error.code = 'INCIDENTE_NO_ENCONTRADO';
      throw error;
    }

    return incidente;
  }

  async actualizarIncidente(id, data) {
    const incidenteActual = await this.obtenerIncidentePorId(id);

    // Validación de la máquina de estados de negocio (ITIL)
    if (data.estado && data.estado !== incidenteActual.estado) {
      const validacion = puedeCambiarEstado(
        incidenteActual.estado,
        data.estado,
        data.resolucion !== undefined ? data.resolucion : incidenteActual.resolucion
      );
      if (!validacion.valido) {
        const error = new Error(validacion.razon);
        error.statusCode = 400;
        error.code = 'INVALID_STATE_TRANSITION';
        throw error;
      }
    }

    return await prisma.incidente.update({
      where: { id: Number(id) },
      data,
    });
  }

  async eliminarIncidente(id) {
    await this.obtenerIncidentePorId(id);

    return await prisma.incidente.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = new IncidenteService();

