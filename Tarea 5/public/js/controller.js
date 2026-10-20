/* ==========================================================================
   CONTROLLER (js/controller.js - English alias / Backwards Compatibility)
   SOC Hospitalario - Hospital Clínico San Rafael
   Soporte híbrido /api/incidentes y data/incidentes.json
   ========================================================================== */
'use strict';

window.SOC = window.SOC || {};

SOC.IncidentController = class extends SOC.Controlador {
  constructor(model, view) {
    // Inicialización por defecto hacia el endpoint oficial de Express
    const m = model || new SOC.IncidentModel('/api/incidentes');
    const v = view || new SOC.IncidentView();
    super(m, v);
    this.apiEndpoint = '/api/incidentes';
  }
};

SOC.Controlador = SOC.Controlador || SOC.IncidentController;
