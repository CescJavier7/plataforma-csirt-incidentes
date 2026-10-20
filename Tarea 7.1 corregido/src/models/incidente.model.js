const incidentes = [
  {
    id: 1,
    titulo: "Ataque de fuerza bruta detectado en SSH",
    prioridad: "ALTA",
    estado: "ABIERTO",
    resolucion: "",
    createdAt: new Date().toISOString()
  },
  {
    id: 2,
    titulo: "Detección de malware Ransomware en endpoint 10.0.4.12",
    prioridad: "CRÍTICA",
    estado: "EN_PROCESO",
    resolucion: "",
    createdAt: new Date().toISOString()
  },
  {
    id: 3,
    titulo: "Campaña de Phishing reportada por usuarios de soporte",
    prioridad: "MEDIA",
    estado: "ABIERTO",
    resolucion: "",
    createdAt: new Date().toISOString()
  }
];

const IncidenteModel = {
  obtenerTodos: () => incidentes,

  obtenerPorId: (id) => incidentes.find((i) => i.id === id),

  // Optimización: retorna únicamente los campos indispensables para el tablero (incluyendo resolucion)
  obtenerResumen: () => {
    return incidentes.map(({ id, titulo, prioridad, estado, resolucion }) => ({
      id,
      titulo,
      prioridad,
      estado,
      resolucion
    }));
  },

  actualizar: (id, campos) => {
    const idx = incidentes.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    incidentes[idx] = { ...incidentes[idx], ...campos };
    return incidentes[idx];
  }
};

module.exports = IncidenteModel;