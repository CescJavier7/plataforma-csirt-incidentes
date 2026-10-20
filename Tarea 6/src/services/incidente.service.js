const prisma = require('../config/prisma');

/**
 * Servicio para la gestión persistente de incidentes en MySQL mediante Prisma ORM.
 */
class IncidenteService {
  /**
   * Crea un nuevo incidente en la base de datos.
   * @param {Object} data - Datos validados del incidente
   * @returns {Promise<Object>} Incidente persistido
   */
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

  /**
   * Lista incidentes con soporte para filtros condicionales opcionales por estado y prioridad.
   * @param {Object} filtros - Filtros opcionales { estado, prioridad }
   * @returns {Promise<Array>} Lista de incidentes
   */
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

  /**
   * Obtiene un incidente por su identificador numérico.
   * @param {number|string} id - Identificador del incidente
   * @returns {Promise<Object>} Incidente encontrado
   * @throws {Error} 404 si el recurso no existe
   */
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

  /**
   * Actualiza un incidente existente tras verificar su existencia.
   * @param {number|string} id - Identificador del incidente
   * @param {Object} data - Campos a actualizar
   * @returns {Promise<Object>} Incidente actualizado
   */
  async actualizarIncidente(id, data) {
    // Valida existencia previa antes de actualizar
    await this.obtenerIncidentePorId(id);

    return await prisma.incidente.update({
      where: { id: Number(id) },
      data,
    });
  }

  /**
   * Elimina un incidente de la base de datos tras verificar su existencia.
   * @param {number|string} id - Identificador del incidente
   * @returns {Promise<Object>} Incidente eliminado
   */
  async eliminarIncidente(id) {
    await this.obtenerIncidentePorId(id);

    return await prisma.incidente.delete({
      where: { id: Number(id) },
    });
  }
}

module.exports = new IncidenteService();
