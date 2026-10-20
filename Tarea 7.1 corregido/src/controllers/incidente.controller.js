const IncidenteModel = require("../models/incidente.model");
const { puedeCambiarEstado } = require("../utils/estado");

const IncidenteController = {
  listar: (req, res) => {
    const lista = IncidenteModel.obtenerResumen();
    return res.status(200).json(lista);
  },

  obtenerPorId: (req, res) => {
    const id = req.incidenteId ?? parseInt(req.params.id, 10);

    const incidente = IncidenteModel.obtenerPorId(id);
    if (!incidente) {
      return res.status(404).json({
        error: "No encontrado",
        detalle: `No se encontró ningún incidente registrado con el ID ${id}`
      });
    }

    return res.status(200).json(incidente);
  },

  actualizarEstado: (req, res) => {
    const id = req.incidenteId ?? parseInt(req.params.id, 10);
    const { nuevoEstado, resolucion } = req.body || {};

    const incidente = IncidenteModel.obtenerPorId(id);
    if (!incidente) {
      return res.status(404).json({ error: "Incidente no localizado" });
    }

    const validacion = puedeCambiarEstado(incidente.estado, nuevoEstado, resolucion);
    if (!validacion.valido) {
      return res.status(400).json({ error: validacion.razon });
    }

    const actualizado = IncidenteModel.actualizar(id, {
      estado: nuevoEstado,
      resolucion: resolucion || ""
    });

    return res.status(200).json(actualizado);
  }
};

module.exports = IncidenteController;