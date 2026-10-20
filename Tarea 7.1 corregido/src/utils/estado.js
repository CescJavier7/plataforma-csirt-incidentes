/**
 * src/utils/estado.js
 * Reglas de negocio para cambios de estado de un incidente.
 * Estados permitidos: ABIERTO, EN_PROCESO, CERRADO
 */
function puedeCambiarEstado(estadoActual, nuevoEstado, resolucion = "") {
  const estadosValidos = ["ABIERTO", "EN_PROCESO", "CERRADO"];

  if (!estadosValidos.includes(nuevoEstado)) {
    return { valido: false, razon: "Estado de destino no válido" };
  }

  if (estadoActual === "CERRADO") {
    return { valido: false, razon: "Un incidente cerrado no puede reactivarse directamente" };
  }

  // Corrección del defecto: Exigencia estricta de resolución técnica para el cierre
  if (nuevoEstado === "CERRADO") {
    if (!resolucion || resolucion.trim().length < 5) {
      return {
        valido: false,
        razon: "Para cerrar un incidente es obligatorio ingresar una resolución de al menos 5 caracteres"
      };
    }
  }

  return { valido: true, razon: "Transición permitida" };
}

module.exports = { puedeCambiarEstado };