/**
 * src/utils/estado.js
 * Reglas de negocio del ciclo de vida de incidentes (ITIL / NIST SP 800-61).
 * Estados permitidos: ABIERTO, EN_PROCESO, RESUELTO, CERRADO
 */
function puedeCambiarEstado(estadoActual, nuevoEstado, resolucion = '') {
  const estadosValidos = ['ABIERTO', 'EN_PROCESO', 'RESUELTO', 'CERRADO'];

  if (!estadosValidos.includes(nuevoEstado)) {
    return { valido: false, razon: `Estado de destino no válido: ${nuevoEstado}` };
  }

  if (estadoActual === 'CERRADO') {
    return { valido: false, razon: 'Un incidente cerrado no puede reactivarse directamente' };
  }

  // Regla de Negocio: Exigencia de justificación técnica para el cierre o resolución
  if (nuevoEstado === 'CERRADO') {
    if (!resolucion || resolucion.trim().length < 5) {
      return {
        valido: false,
        razon: 'Para cerrar un incidente es obligatorio ingresar una resolución de al menos 5 caracteres',
      };
    }
  }

  return { valido: true, razon: 'Transición permitida' };
}

module.exports = { puedeCambiarEstado };

